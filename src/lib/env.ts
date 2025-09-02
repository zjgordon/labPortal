import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export const env = envSchema.parse(process.env)

export function validateEnv() {
  try {
    envSchema.parse(process.env)
    return true
  } catch (error) {
    console.error('❌ Invalid environment variables:', error)
    return false
  }
}
