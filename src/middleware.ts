import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { statusRateLimiter } from "@/lib/rate-limiter"
import { getAdminCorsHeaders } from "@/lib/auth/csrf-protection"
import { createErrorResponse, ErrorCodes } from "@/lib/errors"
import { ResponseOptimizer } from "@/lib/response-optimizer"

/**
 * Next.js middleware for security headers and rate limiting
 * Applies Content Security Policy, security headers, and rate limiting
 * to all routes except static assets
 */
export default function middleware(req: NextRequest) {
  // Content Security Policy - strict CSP for all pages
  const pathname = req.nextUrl?.pathname || req.url ? new URL(req.url).pathname : '/'
  const isAdminPage = pathname.startsWith('/admin') || pathname.includes('admin-test')
  
  // Check if this is an agent endpoint that needs hardening
  const isAgentEndpoint = pathname.startsWith('/api/agents') || 
                         pathname === '/api/control/queue' || 
                         pathname === '/api/control/report'
  
  // Check if this is a public API endpoint
  const isPublicEndpoint = pathname.startsWith('/api/public')
  
  let csp: string
  if (isAdminPage) {
    // More permissive CSP for admin pages (needed for form handling and dynamic content)
    csp = "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';"
  } else {
    // CSP for public pages - allow Next.js to work properly
    csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';"
  }

  // Agent endpoint hardening
  if (isAgentEndpoint) {
    // Reject requests with cookies
    const cookieHeader = req.headers.get('cookie')
    if (cookieHeader) {
      return createErrorResponse(
        ErrorCodes.COOKIES_NOT_ALLOWED,
        'Cookies not allowed for agent endpoints',
        400
      )
    }
    
    // Require Authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(
        JSON.stringify({ error: 'Authorization header with Bearer token required' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Vary': 'Authorization'
          }
        }
      )
    }
  }

  // Public endpoint hardening
  if (isPublicEndpoint) {
    // Reject requests with cookies for security
    const cookieHeader = req.headers.get('cookie')
    if (cookieHeader) {
      return new NextResponse(
        JSON.stringify({ error: 'Cookies not allowed for public endpoints' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Vary': 'Authorization'
          }
        }
      )
    }
  }

  // Rate limiting for status API
  if (pathname === '/api/status') {
    try {
      const clientIP = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
      if (!statusRateLimiter.isAllowed(clientIP)) {
        return new NextResponse(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Retry-After': Math.ceil(statusRateLimiter.getRemainingTime(clientIP) / 1000).toString()
            }
          }
        )
      }
    } catch (error) {
      // If rate limiting fails, continue without it
      console.error('Rate limiting error:', error)
    }
  }

  // Create response with headers
  const response = NextResponse.next()
  
  // Set security headers
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Set basic headers for API routes
  if (pathname.startsWith('/api/')) {
    // Add CORS headers for admin routes
    if (pathname.startsWith('/api/hosts') || 
        pathname.startsWith('/api/cards') || 
        pathname.startsWith('/api/services') ||
        pathname.startsWith('/api/control')) {
      const corsHeaders = getAdminCorsHeaders(req)
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }
  }

  return response
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ]
}
