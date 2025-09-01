import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { statusRateLimiter } from "@/lib/rate-limiter"

export default withAuth(
  function middleware(req) {
    // Add security headers to all responses
    const response = NextResponse.next()
    
    // Content Security Policy - disallow inline scripts
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
    )
    
    // Other security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    // Rate limiting for status API
    if (req.nextUrl.pathname === '/api/status') {
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
    }
    
    // Check if user is trying to access admin routes
    if (req.nextUrl.pathname.startsWith("/admin") && req.nextUrl.pathname !== "/admin/login") {
      // If not authenticated, redirect to login
      if (!req.nextauth.token) {
        return NextResponse.redirect(new URL("/admin/login", req.url))
      }
    }
    
    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login page
        if (req.nextUrl.pathname === "/admin/login") {
          return true
        }
        // Require authentication for other admin routes
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ]
}
