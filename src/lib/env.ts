import { z } from 'zod'

const envSchema = z.object({
  // Required environment variables
  ADMIN_PASSWORD: z.string().min(1, 'ADMIN_PASSWORD is required'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  PUBLIC_BASE_URL: z.string().url('PUBLIC_BASE_URL must be a valid URL'),
  
  // Optional environment variables with defaults
  STATUS_SWEEPER_ENABLED: z.string().transform(val => val === 'true').default('false'),
  HOST_LOCAL_ID: z.string().default('local'),
  ALLOW_SYSTEMCTL: z.string().transform(val => val === 'true').default('false'),
  UNIT_ALLOWLIST_REGEX: z.string().default('^([a-z0-9@._-]+)\\.service$'),
  EXEC_TIMEOUT_MS: z.string().transform(val => parseInt(val, 10)).default('60000'),
  READONLY_PUBLIC_TOKEN: z.string().optional(),
  ADMIN_ALLOWED_ORIGINS: z.string().default('http://localhost:3000,https://portal.local'),
  
  // Additional existing variables
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ADMIN_CRON_SECRET: z.string().min(1).optional(),
})

// Lazy environment validation - only parse when accessed
let _env: z.infer<typeof envSchema> | null = null

function getEnv() {
  if (!_env) {
    try {
      // During development, provide fallbacks for missing environment variables
      const isDevelopment = process.env.NODE_ENV === 'development'
      
      if (isDevelopment) {
        // Provide development fallbacks
        const devEnv = {
          ...process.env,
          ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-secret-key-for-development-only',
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
          DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
          PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || 'http://localhost:3000',
        }
        
        try {
          _env = envSchema.parse(devEnv)
        } catch (error) {
          console.warn('⚠️ Environment validation failed with fallbacks, using process.env directly')
          // Fall back to process.env directly for development
          _env = process.env as any
        }
      } else {
        // Production: strict validation
        _env = envSchema.parse(process.env)
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n  ')
        throw new Error(`❌ Environment validation failed:\n  ${missingVars}`)
      }
      throw error
    }
  }
  return _env
}

export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(target, prop) {
    try {
      const envData = getEnv()
      if (!envData) {
        throw new Error('Environment data is null')
      }
      return envData[prop as keyof typeof envData]
    } catch (error) {
      // During development, return fallback values instead of crashing
      if (process.env.NODE_ENV === 'development') {
        const fallbacks: Record<string, any> = {
          ADMIN_PASSWORD: 'admin123',
          NEXTAUTH_SECRET: 'dev-secret-key-for-development-only',
          NEXTAUTH_URL: 'http://localhost:3000',
          DATABASE_URL: 'file:./dev.db',
          PUBLIC_BASE_URL: 'http://localhost:3000',
        }
        return fallbacks[prop as string] || process.env[prop as string]
      }
      throw error
    }
  }
})

export function validateEnv() {
  try {
    getEnv()
    return true
  } catch (error) {
    // During development, don't fail validation
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Environment validation failed, but continuing in development mode')
      return true
    }
    console.error('❌ Invalid environment variables:', error)
    return false
  }
}

// Type export for use throughout the application
export type Env = z.infer<typeof envSchema>
