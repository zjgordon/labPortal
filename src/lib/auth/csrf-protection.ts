import { NextRequest } from 'next/server'
import { env } from '../env'

/**
 * Verify the origin of the request to prevent CSRF attacks
 * For GET requests, missing Origin is allowed
 * For state-changing methods (POST/PUT/PATCH/DELETE), valid Origin is required
 */
export function verifyOrigin(req: NextRequest): boolean {
  const method = req.method.toUpperCase()
  const origin = req.headers.get('origin')
  
  // For GET requests, allow missing Origin header
  if (method === 'GET') {
    return true
  }
  
  // For state-changing methods, Origin header is required
  if (!origin) {
    console.warn('CSRF Protection: Missing Origin header for state-changing method', {
      method,
      url: req.url,
      userAgent: req.headers.get('user-agent')
    })
    return false
  }
  
  // Parse allowed origins from environment
  const allowedOrigins = env.ADMIN_ALLOWED_ORIGINS.split(',').map(o => o.trim())
  
  // Check if origin exactly matches any allowed origin
  const isAllowed = allowedOrigins.includes(origin)
  
  if (!isAllowed) {
    console.warn('CSRF Protection: Origin not in allowlist', {
      method,
      origin,
      allowedOrigins,
      url: req.url,
      userAgent: req.headers.get('user-agent')
    })
  }
  
  return isAllowed
}

/**
 * Get the appropriate CORS headers for admin routes
 * We don't support cross-origin admin calls, so we either omit
 * Access-Control-Allow-Origin or set it to same-origin
 */
export function getAdminCorsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin')
  const allowedOrigins = env.ADMIN_ALLOWED_ORIGINS.split(',').map(o => o.trim())
  
  // If origin is in our allowlist, we can set it explicitly
  if (origin && allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Allow-Credentials': 'true'
    }
  }
  
  // For unknown origins or missing origin, omit Access-Control-Allow-Origin
  // This prevents browsers from making cross-origin requests
  return {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Allow-Credentials': 'true'
  }
}

/**
 * Helper to create a CSRF error response
 */
export function createCsrfErrorResponse(req: NextRequest): Response {
  const method = req.method.toUpperCase()
  const origin = req.headers.get('origin')
  
  const errorMessage = method === 'GET' 
    ? 'Invalid request'
    : `CSRF protection: Invalid origin '${origin || 'missing'}' for ${method} request`
  
  return new Response(
    JSON.stringify({ 
      error: errorMessage,
      code: 'CSRF_PROTECTION_FAILED'
    }),
    { 
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        ...getAdminCorsHeaders(req)
      }
    }
  )
}
