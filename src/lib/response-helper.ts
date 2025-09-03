import { NextResponse } from 'next/server';

export type RouteType = 'public' | 'admin' | 'agent';

export interface StandardResponseOptions {
  data?: any;
  error?: string;
  status?: number;
  routeType: RouteType;
}

/**
 * Standardized response helper that ensures consistent headers and cache behavior
 * across all API routes.
 */
export class ResponseHelper {
  /**
   * Create a standardized JSON response with appropriate headers
   */
  static json(options: StandardResponseOptions): NextResponse {
    const { data, error, status = 200, routeType } = options;

    const responseBody = error ? { error } : data;

    const response = NextResponse.json(responseBody, { status });

    // Set standard Content-Type
    response.headers.set('Content-Type', 'application/json; charset=utf-8');

    // Set cache control based on route type
    switch (routeType) {
      case 'public':
        // Public routes: cache for 5s with 30s stale-while-revalidate
        response.headers.set(
          'Cache-Control',
          'public, max-age=5, stale-while-revalidate=30'
        );
        break;

      case 'admin':
      case 'agent':
        // Admin/Agent routes: no caching
        response.headers.set(
          'Cache-Control',
          'no-store, no-cache, must-revalidate, proxy-revalidate'
        );
        break;
    }

    return response;
  }

  /**
   * Create a success response
   */
  static success(data: any, routeType: RouteType, status = 200): NextResponse {
    return this.json({ data, routeType, status });
  }

  /**
   * Create an error response
   */
  static error(
    error: string,
    routeType: RouteType,
    status = 500
  ): NextResponse {
    return this.json({ error, routeType, status });
  }

  /**
   * Create a 204 No Content response (useful for queue endpoints)
   */
  static noContent(routeType: RouteType): NextResponse {
    const response = new NextResponse(null, { status: 204 });

    // Set cache control based on route type
    switch (routeType) {
      case 'public':
        response.headers.set(
          'Cache-Control',
          'public, max-age=5, stale-while-revalidate=30'
        );
        break;

      case 'admin':
      case 'agent':
        response.headers.set(
          'Cache-Control',
          'no-store, no-cache, must-revalidate, proxy-revalidate'
        );
        break;
    }

    return response;
  }
}
