import { env } from '@/lib/env';

/**
 * Check if the control plane features are enabled
 * This gates control UI elements until action testing is complete
 */
export function isControlPlaneEnabled(): boolean {
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
