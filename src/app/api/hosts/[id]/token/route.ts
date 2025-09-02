import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAdminAuth, rejectAgentTokens } from '@/lib/auth'
import { generateAgentToken } from '@/lib/auth'

const prisma = new PrismaClient()

/**
 * POST /api/hosts/:id/token - Rotate agent token
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Reject agent tokens on admin endpoints
    const agentRejection = await rejectAgentTokens(request)
    if (agentRejection) return agentRejection
    
    // Check admin authentication
    const authError = await requireAdminAuth(request)
    if (authError) return authError

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
    
    // Generate new token
    const newToken = generateAgentToken()
    
    // Update host with new token
    const updatedHost = await prisma.host.update({
      where: { id },
      data: {
        agentToken: newToken,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        agentToken: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      message: 'Agent token rotated successfully',
      host: updatedHost
    })
  } catch (error) {
    console.error('Error rotating agent token:', error)
    return NextResponse.json(
      { error: 'Failed to rotate agent token' },
      { status: 500 }
    )
  }
}
