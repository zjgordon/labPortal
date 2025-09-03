import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPrincipal, createPrincipalError } from '@/lib/auth/principal'
import { generateAgentToken } from '@/lib/auth/token-utils'
import { verifyOrigin, getAdminCorsHeaders } from '@/lib/auth/csrf-protection'

/**
 * POST /api/hosts/:id/token - Rotate agent token
 * Generates a new token and stores only the hash and prefix
 * Returns the plaintext token only once for immediate use
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate admin authentication
    const principal = await getPrincipal(request, { require: 'admin' })
    
    // CSRF protection for state-changing methods
    if (!verifyOrigin(request)) {
      return NextResponse.json(
        { error: 'CSRF protection: Invalid origin' },
        { status: 400 }
      )
    }
    
    const { id } = params
    
    // Check if host exists
    const existingHost = await prisma.host.findUnique({
      where: { id }
    })
    
    if (!existingHost) {
      return NextResponse.json(
        { error: 'Host not found' },
        { status: 404 }
      )
    }
    
    // Generate new token with hash and prefix
    const tokenInfo = generateAgentToken()
    
    // Update host with new token hash, prefix, and rotation timestamp
    const updatedHost = await prisma.host.update({
      where: { id },
      data: {
        agentTokenHash: tokenInfo.hash,
        agentTokenPrefix: tokenInfo.prefix,
        tokenRotatedAt: new Date(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        agentTokenPrefix: true,
        tokenRotatedAt: true,
        updatedAt: true
      }
    })

    const response = NextResponse.json({
      message: 'Agent token rotated successfully',
      token: tokenInfo.plaintext, // Return plaintext only once
      host: {
        id: updatedHost.id,
        name: updatedHost.name,
        tokenPrefix: updatedHost.agentTokenPrefix,
        tokenRotatedAt: updatedHost.tokenRotatedAt
      }
    })
    
    // Ensure Cache-Control: no-store is set
    response.headers.set('Cache-Control', 'no-store')
    
    return response
  } catch (error) {
    if (error instanceof Error) {
      return createPrincipalError(error) as NextResponse
    }
    
    console.error('Error rotating agent token:', error)
    return NextResponse.json(
      { error: 'Failed to rotate agent token' },
      { status: 500 }
    )
  }
}
