import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAgentAuth, getHostFromToken } from '@/lib/auth'

const prisma = new PrismaClient()

/**
 * POST /api/agents/heartbeat - Update host lastSeenAt timestamp
 */
export async function POST(request: NextRequest) {
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

    // Update the host's lastSeenAt timestamp
    const updatedHost = await prisma.host.update({
      where: { id: host.id },
      data: {
        lastSeenAt: new Date()
      },
      select: {
        id: true,
        name: true,
        lastSeenAt: true
      }
    })

    return NextResponse.json({
      message: 'Heartbeat received',
      host: updatedHost
    })
  } catch (error) {
    console.error('Error processing agent heartbeat:', error)
    return NextResponse.json(
      { error: 'Failed to process heartbeat' },
      { status: 500 }
    )
  }
}
