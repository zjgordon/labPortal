/**
 * Simple in-memory rate limiter
 * Note: This is a best-effort limiter for development/prototyping
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const entry = this.limits.get(identifier)

    if (!entry || now > entry.resetTime) {
      // First request or window expired, create new entry
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs,
      })
      return true
    }

    if (entry.count >= this.config.maxRequests) {
      return false
    }

    // Increment count
    entry.count++
    return true
  }

  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.limits.forEach((entry, identifier) => {
      if (now > entry.resetTime) {
        keysToDelete.push(identifier)
      }
    })
    
    keysToDelete.forEach(key => this.limits.delete(key))
  }

  getRemainingTime(identifier: string): number {
    const entry = this.limits.get(identifier)
    if (!entry) return 0
    return Math.max(0, entry.resetTime - Date.now())
  }
}

// Create rate limiters for different endpoints
export const statusRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute
})

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
})
