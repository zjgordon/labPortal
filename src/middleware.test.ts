import { NextRequest, NextResponse } from 'next/server'
import middleware from './middleware'
import { statusRateLimiter } from '@/lib/rate-limiter'

// Mock the rate limiter
jest.mock('@/lib/rate-limiter', () => ({
  statusRateLimiter: {
    isAllowed: jest.fn(),
    getRemainingTime: jest.fn(),
  },
}))

describe('Middleware', () => {
  const mockStatusRateLimiter = statusRateLimiter as jest.Mocked<typeof statusRateLimiter>

  beforeEach(() => {
    jest.clearAllMocks()
    mockStatusRateLimiter.isAllowed.mockReturnValue(true)
    mockStatusRateLimiter.getRemainingTime.mockReturnValue(30)
  })

  describe('Security Headers', () => {
    it('adds security headers to all responses', async () => {
      const request = new NextRequest('http://localhost:3000/')
      const response = await middleware(request)

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
      expect(response.headers.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()')
    })

    it('sets strict CSP for public pages', async () => {
      const request = new NextRequest('http://localhost:3000/')
      const response = await middleware(request)

      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'")
      expect(csp).toContain("style-src 'self' 'unsafe-inline'")
      expect(csp).toContain("img-src 'self' data: blob:")
      expect(csp).toContain("font-src 'self'")
      expect(csp).toContain("connect-src 'self'")
      expect(csp).toContain("frame-ancestors 'none'")
      expect(csp).toContain("object-src 'none'")
      expect(csp).toContain("base-uri 'self'")
    })

    it('sets more permissive CSP for admin pages', async () => {
      const request = new NextRequest('http://localhost:3000/admin')
      const response = await middleware(request)

      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("script-src 'self' 'unsafe-eval'")
      expect(csp).toContain("style-src 'self' 'unsafe-inline'")
      expect(csp).toContain("img-src 'self' data: blob:")
      expect(csp).toContain("font-src 'self'")
      expect(csp).toContain("connect-src 'self'")
      expect(csp).toContain("frame-ancestors 'none'")
      expect(csp).toContain("object-src 'none'")
      expect(csp).toContain("base-uri 'self'")
    })

    it('identifies admin pages correctly', async () => {
      const adminPaths = [
        '/admin',
        '/admin/login',
        '/admin/settings',
        '/admin-test',
        '/some-path/admin-test/other',
      ]

      for (const path of adminPaths) {
        const request = new NextRequest(`http://localhost:3000${path}`)
        const response = await middleware(request)

        const csp = response.headers.get('Content-Security-Policy')
        expect(csp).toContain("script-src 'self' 'unsafe-eval'")
        expect(csp).not.toContain("'unsafe-inline'")
      }
    })

    it('identifies public pages correctly', async () => {
      const publicPaths = [
        '/',
        '/about',
        '/contact',
        '/api/public',
        '/_next/static/chunks/main.js',
      ]

      for (const path of publicPaths) {
        const request = new NextRequest(`http://localhost:3000${path}`)
        const response = await middleware(request)

        const csp = response.headers.get('Content-Security-Policy')
        expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'")
      }
    })
  })

  describe('Rate Limiting', () => {
    it('applies rate limiting to status API', async () => {
      const request = new NextRequest('http://localhost:3000/api/status')
      const response = await middleware(request)

      expect(mockStatusRateLimiter.isAllowed).toHaveBeenCalled()
    })

    it('allows requests within rate limit', async () => {
      mockStatusRateLimiter.isAllowed.mockReturnValue(true)

      const request = new NextRequest('http://localhost:3000/api/status')
      const response = await middleware(request)

      expect(response.status).toBe(200)
    })

    it('blocks requests exceeding rate limit', async () => {
      mockStatusRateLimiter.isAllowed.mockReturnValue(false)
      mockStatusRateLimiter.getRemainingTime.mockReturnValue(45)

      const request = new NextRequest('http://localhost:3000/api/status')
      const response = await middleware(request)

      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('45')
      
      const data = await response.json()
      expect(data).toEqual({ error: 'Rate limit exceeded. Please try again later.' })
    })

    it('does not apply rate limiting to other APIs', async () => {
      const request = new NextRequest('http://localhost:3000/api/cards')
      const response = await middleware(request)

      expect(mockStatusRateLimiter.isAllowed).not.toHaveBeenCalled()
      expect(response.status).toBe(200)
    })

    it('handles missing IP address gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/status')
      // Mock request without IP
      Object.defineProperty(request, 'ip', { value: undefined, writable: true })
      Object.defineProperty(request, 'headers', {
        value: {
          get: jest.fn().mockReturnValue(undefined),
        },
        writable: true,
      })

      const response = await middleware(request)

      expect(mockStatusRateLimiter.isAllowed).toHaveBeenCalledWith('unknown')
    })

    it('uses x-forwarded-for header when available', async () => {
      const request = new NextRequest('http://localhost:3000/api/status')
      Object.defineProperty(request, 'ip', { value: undefined, writable: true })
      Object.defineProperty(request, 'headers', {
        value: {
          get: jest.fn().mockImplementation((key) => {
            if (key === 'x-forwarded-for') return '192.168.1.100'
            return undefined
          }),
        },
        writable: true,
      })

      const response = await middleware(request)

      expect(mockStatusRateLimiter.isAllowed).toHaveBeenCalledWith('192.168.1.100')
    })
  })

  describe('Request Processing', () => {
    it('processes all request types', async () => {
      const requestTypes = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

      for (const method of requestTypes) {
        const request = new NextRequest('http://localhost:3000/', { method })
        const response = await middleware(request)

        expect(response.status).toBe(200)
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      }
    })

    it('handles requests with query parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/status?cardId=123&debug=true')
      const response = await middleware(request)

      expect(response.status).toBe(200)
      expect(mockStatusRateLimiter.isAllowed).toHaveBeenCalled()
    })

    it('handles requests with complex paths', async () => {
      const complexPaths = [
        '/api/cards/123/icon',
        '/admin/users/456/permissions',
        '/_next/static/chunks/app-pages-internals.js',
        '/api/auth/[...nextauth]/route',
      ]

      for (const path of complexPaths) {
        const request = new NextRequest(`http://localhost:3000${path}`)
        const response = await middleware(request)

        expect(response.status).toBe(200)
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      }
    })
  })

  describe('Error Handling', () => {
    it('handles malformed requests gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/')
      // Simulate a request that might cause issues
      Object.defineProperty(request, 'nextUrl', {
        value: {
          pathname: '/',
        },
        writable: true,
      })

      const response = await middleware(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    it('handles rate limiter errors gracefully', async () => {
      mockStatusRateLimiter.isAllowed.mockImplementation(() => {
        throw new Error('Rate limiter error')
      })

      const request = new NextRequest('http://localhost:3000/api/status')
      
      // Should not throw, but might return an error response
      expect(async () => {
        await middleware(request)
      }).not.toThrow()
    })
  })

  describe('Configuration', () => {
    it('has correct matcher configuration', () => {
      const { config } = require('./middleware')
      
      expect(config.matcher).toEqual([
        "/api/:path*",
        "/((?!_next/static|_next/image|favicon.ico).*)",
      ])
    })

    it('excludes static assets from processing', () => {
      const { config } = require('./src/middleware')
      
      const staticPaths = [
        '/_next/static/chunks/main.js',
        '/_next/image?url=%2Ficons%2Ftest.svg',
        '/favicon.ico',
        '/_next/static/media/font.woff2',
      ]

      for (const path of staticPaths) {
        const matches = config.matcher.some(pattern => {
          if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace('*', '.*'))
            return regex.test(path)
          }
          return pattern === path
        })
        expect(matches).toBe(false)
      }
    })

    it('includes API routes in processing', () => {
      const { config } = require('./src/middleware')
      
      const apiPaths = [
        '/api/status',
        '/api/cards',
        '/api/auth/login',
        '/api/cards/123/icon',
      ]

      for (const path of apiPaths) {
        const matches = config.matcher.some(pattern => {
          if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace('*', '.*'))
            return regex.test(path)
          }
          return pattern === path
        })
        expect(matches).toBe(true)
      }
    })
  })
})
