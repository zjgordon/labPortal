import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { statusRateLimiter } from "@/lib/rate-limiter"

export default async function middleware(req: NextRequest) {
  // Add security headers to all responses
  const response = NextResponse.next()

  // Content Security Policy - allow inline scripts for admin pages
  const isAdminPage = req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.includes('admin-test')
  
  if (isAdminPage) {
    // More permissive CSP for admin pages
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
    )
  } else {
    // Allow inline scripts for Next.js to work properly
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
    )
  }

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

  return response
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ]
}
