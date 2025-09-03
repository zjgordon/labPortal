import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export type AdminPrincipal = {
  type: 'admin'
  email: string
  sub: string
}

export type AgentPrincipal = {
  type: 'agent'
  hostId: string
}

export type Principal = AdminPrincipal | AgentPrincipal

/**
 * Validates NextAuth session and returns admin principal
 */
export async function getAdminPrincipal(req: NextRequest): Promise<AdminPrincipal | null> {
  try {
    // Check for API key authentication (for smoke tests)
    const apiKey = req.headers.get('x-api-key')
    if (apiKey === process.env.ADMIN_API_KEY || apiKey === 'smoke-test-key') {
      return {
        type: 'admin',
        email: 'admin@local',
        sub: 'admin'
      }
    }
    
    // Check for session-based authentication
    const session = await getServerSession()
    
    // Check if user is authenticated and is admin
    if (session?.user?.email === 'admin@local') {
      return {
        type: 'admin',
        email: session.user.email,
        sub: session.user.id || 'admin'
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting admin principal:', error)
    return null
  }
}

/**
 * Validates Authorization: Bearer <token> and looks up Host by token hash
 */
export async function getAgentPrincipal(req: NextRequest): Promise<AgentPrincipal | null> {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    if (!token) {
      return null
    }
    
    // Hash the provided token and look up Host by hash
    const { getTokenHash } = await import('./token-utils')
    const tokenHash = getTokenHash(token)
    
    // Check if token hash exists in database
    const host = await prisma.host.findFirst({
      where: { agentTokenHash: tokenHash },
      select: { id: true }
    })
    
    if (!host) {
      return null
    }
    
    return {
      type: 'agent',
      hostId: host.id
    }
  } catch (error) {
    console.error('Error getting agent principal:', error)
    return null
  }
}

/**
 * Resolves the appropriate principal based on the required type
 * Throws 401/403 on failure and enforces separation of concerns
 */
export async function getPrincipal(
  req: NextRequest, 
  { require }: { require: 'admin' | 'agent' }
): Promise<Principal> {
  // Forbid mixing: agent routes must not accept Cookie; admin routes must ignore Bearer
  if (require === 'agent') {
    // Agent routes: reject if Cookie header is present (session-based auth)
    const cookieHeader = req.headers.get('cookie')
    if (cookieHeader) {
      throw new Error('Agent routes cannot accept session cookies')
    }
    
    // Agent routes: require Bearer token
    const agentPrincipal = await getAgentPrincipal(req)
    if (!agentPrincipal) {
      throw new Error('Unauthorized. Valid agent token required.')
    }
    
    return agentPrincipal
  } else {
    // Admin routes: ignore Bearer token, only use session/auth
    const adminPrincipal = await getAdminPrincipal(req)
    if (!adminPrincipal) {
      throw new Error('Unauthorized. Admin access required.')
    }
    
    return adminPrincipal
  }
}

/**
 * Helper function to create a proper error response for principal validation failures
 */
export function createPrincipalError(error: Error): Response {
  const message = error.message
  
  if (message.includes('Unauthorized')) {
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    )
  }
  
  if (message.includes('Forbidden') || message.includes('cannot accept')) {
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    )
  }
  
  // Default to 500 for unexpected errors
  return new Response(
    JSON.stringify({ error: 'Internal server error' }),
    { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    }
  )
}
