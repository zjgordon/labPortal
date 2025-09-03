import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_ALLOWED_ORIGINS: z.string().default('http://localhost:3000,https://portal.local'),
  READONLY_PUBLIC_TOKEN: z.string().min(1).optional(),
  ADMIN_CRON_SECRET: z.string().min(1).optional(),
})

// Lazy environment validation - only parse when accessed
let _env: z.infer<typeof envSchema> | null = null

function getEnv() {
  if (!_env) {
    _env = envSchema.parse(process.env)
  }
  return _env
}

export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(target, prop) {
    return getEnv()[prop as keyof typeof _env]
  }
})

export function validateEnv() {
  try {
    getEnv()
    return true
  } catch (error) {
    console.error('❌ Invalid environment variables:', error)
    return false
  }
}

/**
 * Local action execution configuration
 */
export const LOCAL_ACTION_CONFIG = {
  HOST_LOCAL_ID: process.env.HOST_LOCAL_ID || 'local',
  ALLOW_SYSTEMCTL: process.env.ALLOW_SYSTEMCTL === 'true',
  UNIT_ALLOWLIST_REGEX: process.env.UNIT_ALLOWLIST_REGEX || '^([a-z0-9@._-]+)\\.service$',
  EXEC_TIMEOUT_MS: parseInt(process.env.EXEC_TIMEOUT_MS || '60000', 10),
} as const
