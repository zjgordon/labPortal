import { z } from 'zod';

const envSchema = z.object({
  // Required environment variables
  ADMIN_PASSWORD: z.string().min(1, 'ADMIN_PASSWORD is required'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  PUBLIC_BASE_URL: z.string().url('PUBLIC_BASE_URL must be a valid URL'),

  // Optional environment variables with defaults
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  STATUS_SWEEPER_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  HOST_LOCAL_ID: z.string().default('local'),
  ALLOW_SYSTEMCTL: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  UNIT_ALLOWLIST_REGEX: z.string().default('^([a-z0-9@._-]+)\\\\.service$'),
  EXEC_TIMEOUT_MS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('60000'),
  ENABLE_CONTROL_PLANE: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  READONLY_PUBLIC_TOKEN: z.string().default(''),
  ADMIN_CRON_SECRET: z.string().default(''),
  ADMIN_ALLOWED_ORIGINS: z.string().default(''),
  APPEARANCE_INSTANCE_NAME: z.string().default('Lab Portal'),
  APPEARANCE_HEADER_TEXT: z.string().default('Lab Portal'),
});

// Only parse environment variables on the server side
// On the client side, return a safe default object
export const env =
  typeof window === 'undefined'
    ? envSchema.parse(process.env)
    : {
        // Client-side defaults - these should never be used for sensitive operations
        ADMIN_PASSWORD: '',
        NEXTAUTH_SECRET: '',
        NEXTAUTH_URL: '',
        DATABASE_URL: '',
        PUBLIC_BASE_URL: '',
        NODE_ENV: 'development' as const,
        STATUS_SWEEPER_ENABLED: true,
        HOST_LOCAL_ID: 'local',
        ALLOW_SYSTEMCTL: false,
        UNIT_ALLOWLIST_REGEX: '^([a-z0-9@._-]+)\\.service$',
        EXEC_TIMEOUT_MS: 60000,
        ENABLE_CONTROL_PLANE: false,
        READONLY_PUBLIC_TOKEN: '',
        ADMIN_CRON_SECRET: '',
        ADMIN_ALLOWED_ORIGINS: '',
        APPEARANCE_INSTANCE_NAME: 'Lab Portal',
        APPEARANCE_HEADER_TEXT: 'Lab Portal',
      };

export function validateEnv() {
  // Only validate on server side
  if (typeof window !== 'undefined') {
    return true; // Skip validation on client side
  }

  try {
    // Access env to trigger validation
    const _ = env;
    return true;
  } catch (error) {
    // During development, don't fail validation
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️ Environment validation failed, but continuing in development mode'
      );
      return true;
    }
    console.error('❌ Invalid environment variables:', error);
    return false;
  }
}

// Type export for use throughout the application
export type Env = z.infer<typeof envSchema>;
