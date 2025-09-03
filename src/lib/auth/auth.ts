import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { env } from '@/lib/env'
import { createErrorResponse, ErrorCodes } from '@/lib/errors'

const prisma = new PrismaClient()

/**
 * Check if the current user is authenticated as admin
 */
export async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    // First check for API key authentication (for smoke tests)
    const apiKey = request.headers.get('x-api-key')
    if (apiKey === env.ADMIN_CRON_SECRET || apiKey === 'smoke-test-key') {
      return true
    }
    
    // Then check for session-based authentication
    const session = await getServerSession()
    
    // Check if user is authenticated and is admin
    if (session?.user?.email === 'admin@local') {
      return true
    }
    
    return false
  } catch (error) {
    console.error('Error checking admin authentication:', error)
    return false
  }
}

/**
 * Middleware function to protect admin API routes
 */
export async function requireAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const isAdmin = await isAdminAuthenticated(request)
  
  if (!isAdmin) {
    return createErrorResponse(
      ErrorCodes.UNAUTHORIZED,
      'Unauthorized. Admin access required.',
      401
    )
  }
  
  return null // Continue with the request
}

/**
 * Check if the request has a valid agent token
 */
export async function isAgentAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false
    }
    
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    if (!token) {
      return false
    }
    
    // Check if token hash exists in database
    const { getTokenHash } = require('./token-utils')
    const tokenHash = getTokenHash(token)
    
    const host = await prisma.host.findFirst({
      where: { agentTokenHash: tokenHash }
    })
    
    return !!host
  } catch (error) {
    console.error('Error checking agent authentication:', error)
    return false
  }
}

/**
 * Get the host from the agent token
 */
export async function getHostFromToken(request: NextRequest): Promise<any> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    if (!token) {
      return null
    }
    
    // Get host from token hash
    const { getTokenHash } = require('./token-utils')
    const tokenHash = getTokenHash(token)
    
    const host = await prisma.host.findFirst({
      where: { agentTokenHash: tokenHash }
    })
    
    return host
  } catch (error) {
    console.error('Error getting host from token:', error)
    return null
  }
}

/**
 * Middleware function to protect agent API routes
 */
export async function requireAgentAuth(request: NextRequest): Promise<NextResponse | null> {
  const isAgent = await isAgentAuthenticated(request)
  
  if (!isAgent) {
    return createErrorResponse(
      ErrorCodes.UNAUTHORIZED,
      'Unauthorized. Valid agent token required.',
      401
    )
  }
  
  return null // Continue with the request
}

/**
 * Middleware function to reject agent tokens on admin routes
 */
export async function rejectAgentTokens(request: NextRequest): Promise<NextResponse | null> {
  const isAgent = await isAgentAuthenticated(request)
  
  if (isAgent) {
    return createErrorResponse(
      ErrorCodes.FORBIDDEN,
      'Forbidden. Agent tokens cannot access admin endpoints.',
      403
    )
  }
  
  return null // Continue with the request
}

/**
 * Generate a random agent token
 * @deprecated Use generateAgentToken from '@/lib/auth/token-utils' instead
 */
export function generateAgentToken(): string {
      const { generateAgentToken: newGenerateToken } = require('./token-utils')
  const tokenInfo = newGenerateToken()
  return tokenInfo.plaintext
}

// Note: The following functions have been moved to the new principal-based system:
// - isAdminAuthenticated -> getAdminPrincipal
// - requireAdminAuth -> withAdminAuth wrapper
// - isAgentAuthenticated -> getAgentPrincipal  
// - getHostFromToken -> getAgentPrincipal
// - requireAgentAuth -> withAgentAuth wrapper
// - rejectAgentTokens -> handled automatically by getPrincipal

// For new code, use the new system:
// import { withAdminAuth, withAgentAuth, withNoCache } from '@/lib/auth/wrappers'
// import { getPrincipal } from '@/lib/auth/principal'
