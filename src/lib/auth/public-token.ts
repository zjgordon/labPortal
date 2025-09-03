import { env } from '@/lib/env'

/**
 * Validates a public readonly token from query parameters or Authorization header
 * @param request: The incoming request
 * @returns true if token is valid, false otherwise
 */
export function validatePublicToken(request: Request): boolean {
  // If no public token is configured, disable public endpoints
  if (!env.READONLY_PUBLIC_TOKEN) {
    return false
  }
  
  const url = new URL(request.url)
  const queryToken = url.searchParams.get('token')
  const authHeader = request.headers.get('authorization')
  
  // Check query parameter first
  if (queryToken && queryToken === env.READONLY_PUBLIC_TOKEN) {
    return true
  }
  
  // Check Authorization header
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    if (token === env.READONLY_PUBLIC_TOKEN) {
      return true
    }
  }
  
  return false
}

/**
 * Creates a response for invalid public token
 */
export function createInvalidTokenResponse(): Response {
  const errorMessage = env.READONLY_PUBLIC_TOKEN 
    ? 'Invalid or missing public token' 
    : 'Public API is not configured. Set READONLY_PUBLIC_TOKEN environment variable.'
    
  return new Response(
    JSON.stringify({ error: errorMessage }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'WWW-Authenticate': 'Bearer'
      }
    }
  )
}
