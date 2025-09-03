import { NextRequest } from 'next/server'
import { env } from '../env'

export interface OriginValidationResult {
  isValid: boolean
  details?: string
}

/**
 * Validate the origin of admin requests to prevent CSRF attacks
 * This function provides a more detailed validation result than the boolean-only CSRF protection
 */
export function validateAdminOrigin(request: NextRequest): OriginValidationResult {
  const method = request.method.toUpperCase()
  const origin = request.headers.get('origin')
  
  // For GET requests, allow missing Origin header
  if (method === 'GET') {
    return { isValid: true }
  }
  
  // For state-changing methods, Origin header is required
  if (!origin) {
    return {
      isValid: false,
      details: `Missing Origin header for ${method} request`
    }
  }
  
  // Parse allowed origins from environment
  const allowedOrigins = env.ADMIN_ALLOWED_ORIGINS.split(',').map(o => o.trim())
  
  // Check if origin exactly matches any allowed origin
  const isAllowed = allowedOrigins.includes(origin)
  
  if (!isAllowed) {
    return {
      isValid: false,
      details: `Origin '${origin}' not in allowlist. Allowed: ${allowedOrigins.join(', ')}`
    }
  }
  
  return { isValid: true }
}
