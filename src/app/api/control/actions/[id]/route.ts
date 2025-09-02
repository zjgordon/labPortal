import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAdminAuth, rejectAgentTokens } from '@/lib/auth'

const prisma = new PrismaClient()

/**
 * GET /api/control/actions/:id - Get action status
 */
export async function GET(
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
    
    // Get the action with related data
    const action = await prisma.action.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            name: true
          }
        },
        service: {
          select: {
            id: true,
            unitName: true,
            displayName: true
          }
        }
      }
    })
    
    if (!action) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(action)
  } catch (error) {
    console.error('Error fetching action:', error)
    return NextResponse.json(
      { error: 'Failed to fetch action' },
      { status: 500 }
    )
  }
}
