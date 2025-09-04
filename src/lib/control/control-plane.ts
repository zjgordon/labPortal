import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';

/**
 * Check if the control plane features are enabled
 * This gates control UI elements until action testing is complete
 *
 * Primary: Reads from database (Appearance.controlPlaneEnabled)
 * Fallback: Environment variable (ENABLE_CONTROL_PLANE) - deprecated, use admin dashboard toggle
 */
export async function isControlPlaneEnabled(): Promise<boolean> {
  try {
    // Try to get the setting from the database first
    const appearance = await prisma.appearance.findUnique({
      where: { id: 1 },
      select: { controlPlaneEnabled: true },
    });

    if (appearance) {
      return appearance.controlPlaneEnabled;
    }
  } catch (error) {
    console.warn(
      'Failed to read control plane setting from database, falling back to environment variable:',
      error
    );
  }

  // Fallback to environment variable
  return env.ENABLE_CONTROL_PLANE;
}

/**
 * Synchronous version for client-side usage
 * Returns false by default on client side to avoid hydration issues
 */
export function isControlPlaneEnabledSync(): boolean {
  // On client side, always return false to avoid hydration issues
  // The actual value will be fetched and updated via API calls
  if (typeof window !== 'undefined') {
    return false;
  }

  // On server side, return environment variable as fallback
  return env.ENABLE_CONTROL_PLANE;
}

/**
 * Get control plane status for display purposes
 */
export function getControlPlaneStatus() {
  const enabled = isControlPlaneEnabled();
  return {
    enabled,
    label: enabled ? 'Enabled' : 'Disabled (Experimental)',
    description: enabled
      ? 'Control plane features are active'
      : 'Control plane features are disabled until action testing is complete',
  };
}
