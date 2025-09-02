import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),
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
