import { prisma } from '../prisma';

export interface AppearanceConfig {
  id: number;
  instanceName: string;
  headerText: string | null;
  showClock: boolean;
  theme: string;
  updatedAt: Date;
}

// In-memory cache with 30 second TTL
let appearanceCache: {
  data: AppearanceConfig | null;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 30 * 1000; // 30 seconds

/**
 * Get the current appearance configuration
 * @param revalidate - Force refresh the cache if true
 * @returns Appearance configuration with env fallbacks
 */
export async function getAppearance(
  revalidate = false
): Promise<AppearanceConfig> {
  const now = Date.now();

  // Return cached data if still valid and not forcing revalidation
  if (
    !revalidate &&
    appearanceCache &&
    now - appearanceCache.timestamp < CACHE_TTL_MS
  ) {
    return appearanceCache.data!;
  }

  try {
    // Try to get from database
    const dbAppearance = await prisma.appearance.findUnique({
      where: { id: 1 },
    });

    if (dbAppearance) {
      const config: AppearanceConfig = {
        id: dbAppearance.id,
        instanceName: dbAppearance.instanceName,
        headerText: dbAppearance.headerText,
        showClock: dbAppearance.showClock,
        theme: dbAppearance.theme,
        updatedAt: dbAppearance.updatedAt,
      };

      // Update cache
      appearanceCache = {
        data: config,
        timestamp: now,
      };

      return config;
    }
  } catch (error) {
    console.warn('Failed to fetch appearance from database:', error);
  }

  // Fallback to environment variables if DB is unavailable or empty
  const fallbackConfig: AppearanceConfig = {
    id: 1,
    instanceName: process.env.APPEARANCE_INSTANCE_NAME ?? 'Lab Portal',
    headerText: process.env.APPEARANCE_HEADER_TEXT ?? null,
    showClock: true,
    theme: 'system',
    updatedAt: new Date(),
  };

  // Update cache with fallback
  appearanceCache = {
    data: fallbackConfig,
    timestamp: now,
  };

  return fallbackConfig;
}

/**
 * Clear the appearance cache to force refresh on next call
 */
export function clearAppearanceCache(): void {
  appearanceCache = null;
}
