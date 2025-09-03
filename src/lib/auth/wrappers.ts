import { NextRequest, NextResponse } from 'next/server'
import { getPrincipal, createPrincipalError } from './principal'
import type { Principal } from './principal'

export type RouteHandler = (
  req: NextRequest,
  principal: Principal
) => Promise<NextResponse>

/**
 * Wrapper for admin-only routes
 * Validates admin authentication and provides the principal to the handler
 */
export function withAdminAuth(handler: RouteHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const principal = await getPrincipal(req, { require: 'admin' })
      const response = await handler(req, principal)
      
      // Ensure Cache-Control: no-store is set
      response.headers.set('Cache-Control', 'no-store')
      
      return response
    } catch (error) {
      if (error instanceof Error) {
        return createPrincipalError(error) as NextResponse
      }
      
      // Fallback for unexpected errors
      return NextResponse.json(
        { error: 'Internal server error' },
        { 
          status: 500,
          headers: { 'Cache-Control': 'no-store' }
        }
      )
    }
  }
}

/**
 * Wrapper for agent-only routes
 * Validates agent authentication and provides the principal to the handler
 */
export function withAgentAuth(handler: RouteHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const principal = await getPrincipal(req, { require: 'agent' })
      const response = await handler(req, principal)
      
      // Ensure Cache-Control: no-store and Vary: Authorization are set for agent responses
      response.headers.set('Cache-Control', 'no-store')
      response.headers.set('Vary', 'Authorization')
      
      return response
    } catch (error) {
      if (error instanceof Error) {
        return createPrincipalError(error) as NextResponse
      }
      
      // Fallback for unexpected errors
      return NextResponse.json(
        { error: 'Internal server error' },
        { 
          status: 500,
          headers: { 
            'Cache-Control': 'no-store',
            'Vary': 'Authorization'
          }
        }
      )
    }
  }
}

/**
 * Wrapper for public routes that still need Cache-Control: no-store
 */
export function withNoCache(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const response = await handler(req)
    
    // Ensure Cache-Control: no-store is set
    response.headers.set('Cache-Control', 'no-store')
    
    return response
  }
}
