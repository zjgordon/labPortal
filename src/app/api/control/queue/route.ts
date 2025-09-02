import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAgentAuth, getHostFromToken } from '@/lib/auth'

const prisma = new PrismaClient()

/**
 * GET /api/control/queue - Get next queued action for this host
 */
export async function GET(request: NextRequest) {
  try {
    // Check agent authentication
    const authError = await requireAgentAuth(request)
    if (authError) return authError

    // Get the host from the token
    const host = await getHostFromToken(request)
    if (!host) {
      return NextResponse.json(
        { error: 'Host not found for token' },
        { status: 404 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const max = parseInt(searchParams.get('max') || '1')
    
    // Validate max parameter
    if (max < 1 || max > 10) {
      return NextResponse.json(
        { error: 'Max parameter must be between 1 and 10' },
        { status: 400 }
      )
    }

    // Get the oldest queued actions for this host
    const actions = await prisma.action.findMany({
      where: {
        hostId: host.id,
        status: 'queued'
      },
      include: {
        service: {
          select: {
            id: true,
            unitName: true,
            displayName: true,
            description: true
          }
        }
      },
      orderBy: {
        requestedAt: 'asc' // Oldest first
      },
      take: max
    })

    return NextResponse.json(actions)
  } catch (error) {
    console.error('Error fetching agent queue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent queue' },
      { status: 500 }
    )
  }
}
