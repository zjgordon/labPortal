import { NextRequest, NextResponse } from 'next/server'

export interface ResponseOptimizerOptions {
  contentType?: string
  cacheControl?: string
  vary?: string
}

/**
 * Optimizes API responses with proper headers (Edge Runtime compatible)
 */
export class ResponseOptimizer {
  /**
   * Creates an optimized response with proper headers
   */
  static createOptimizedResponse(
    data: any,
    options: ResponseOptimizerOptions = {}
  ): NextResponse {
    const {
      contentType = 'application/json; charset=utf-8',
      cacheControl,
      vary
    } = options

    // Create base response
    const response = NextResponse.json(data)
    
    // Set content type
    response.headers.set('Content-Type', contentType)
    
    // Set cache control if provided
    if (cacheControl) {
      response.headers.set('Cache-Control', cacheControl)
    }
    
    // Set vary header if provided
    if (vary) {
      response.headers.set('Vary', vary)
    }
    
    return response
  }

  /**
   * Gets appropriate cache control headers based on endpoint type
   */
  static getCacheControl(pathname: string): string {
    // Admin and agent APIs: never cache
    if (pathname.startsWith('/api/admin') || 
        pathname.startsWith('/api/agents') || 
        pathname.startsWith('/api/control') ||
        pathname.startsWith('/api/hosts') ||
        pathname.startsWith('/api/cards') ||
        pathname.startsWith('/api/services')) {
      return 'no-store, no-cache, must-revalidate, proxy-revalidate'
    }
    
    // Public status APIs: cache for 5s with stale-while-revalidate
    if (pathname.startsWith('/api/public/status') || 
        pathname === '/api/status/summary' ||
        pathname === '/api/status/history') {
      return 'public, max-age=5, stale-while-revalidate=30'
    }
    
    // Default: no cache
    return 'no-store'
  }

  /**
   * Gets appropriate vary headers based on endpoint type
   */
  static getVaryHeader(pathname: string): string | undefined {
    // Agent and public endpoints vary by authorization
    if (pathname.startsWith('/api/agents') || 
        pathname.startsWith('/api/public') ||
        pathname === '/api/control/queue' ||
        pathname === '/api/control/report') {
      return 'Authorization'
    }
    
    return undefined
  }
}
