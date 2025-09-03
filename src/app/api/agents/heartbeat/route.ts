import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAgentAuth } from '@/lib/auth/wrappers'
import type { Principal } from '@/lib/auth/principal'

/**
 * POST /api/agents/heartbeat - Update host lastSeenAt timestamp
 */
export const POST = withAgentAuth(async (request: NextRequest, principal: Principal) => {
  try {
    // The principal is already validated and contains the hostId
    // Since this is an agent route, principal will be AgentPrincipal
    if (principal.type !== 'agent') {
      throw new Error('Expected agent principal')
    }
    const { hostId } = principal

    // Update the host's lastSeenAt timestamp
    const updatedHost = await prisma.host.update({
      where: { id: hostId },
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
      host: updatedHost,
      principal: principal
    })
  } catch (error) {
    console.error('Error processing agent heartbeat:', error)
    return NextResponse.json(
      { error: 'Failed to process heartbeat' },
      { status: 500 }
    )
  }
})
