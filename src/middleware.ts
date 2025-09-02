import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { statusRateLimiter } from "@/lib/rate-limiter"

/**
 * Next.js middleware for security headers and rate limiting
 * Applies Content Security Policy, security headers, and rate limiting
 * to all routes except static assets
 */
export default async function middleware(req: NextRequest) {
  // Content Security Policy - strict CSP for all pages
  const pathname = req.nextUrl?.pathname || req.url ? new URL(req.url).pathname : '/'
  const isAdminPage = pathname.startsWith('/admin') || pathname.includes('admin-test')
  
  let csp: string
  if (isAdminPage) {
    // More permissive CSP for admin pages (needed for form handling and dynamic content)
    csp = "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';"
  } else {
    // CSP for public pages - allow Next.js to work properly
    csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';"
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
              'Content-Type': 'application/json',
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

  return response
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ]
}
