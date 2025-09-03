import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { withAgentAuth } from '@/lib/auth/wrappers'
import type { Principal } from '@/lib/auth/principal'
import { ActionFSM } from '@/lib/control/fsm'
import { createErrorResponse, ErrorCodes } from '@/lib/errors'

const prisma = new PrismaClient()

/**
 * GET /api/control/queue - Get next queued action for this host
 * 
 * Parameters:
 * - max: Number of actions to return (1-10, default: 1)
 * - wait: Seconds to poll for actions (0-25, default: 0)
 * 
 * Response:
 * - 200: Actions found and returned as JSON array
 * - 204: No actions available (when wait=0 or polling timeout)
 * - 400: Invalid parameters
 * - 401: Missing or invalid authentication
 * - 500: Server error
 * 
 * When wait > 0, the endpoint will poll the database every ~500ms up to the specified wait time.
 * Actions are automatically locked (status=running, startedAt=now()) when returned.
 */
export const GET = withAgentAuth(async (request: NextRequest, principal: Principal) => {
  try {
    // The principal is already validated and contains the hostId
    if (principal.type !== 'agent') {
      throw new Error('Expected agent principal')
    }
    const { hostId } = principal

    // Get and validate query parameters
    const { searchParams } = new URL(request.url)
    const max = parseInt(searchParams.get('max') || '1')
    const wait = parseInt(searchParams.get('wait') || '0')
    
    // Validate max parameter
    if (max < 1 || max > 10) {
      return createErrorResponse(
        ErrorCodes.INVALID_PARAMETERS,
        'Max parameter must be between 1 and 10',
        400
      )
    }
    
    // Validate wait parameter
    if (wait < 0 || wait > 25) {
      return createErrorResponse(
        ErrorCodes.INVALID_PARAMETERS,
        'Wait parameter must be between 0 and 25 seconds',
        400
      )
    }

    // Function to get and lock actions
    const getAndLockActions = async () => {
      // Use a transaction to ensure atomicity when locking actions
      return await prisma.$transaction(async (tx) => {
        // Find queued actions for this host
        const queuedActions = await tx.action.findMany({
          where: {
            hostId: hostId,
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

        if (queuedActions.length === 0) {
          return []
        }

        // Validate state transitions using FSM before locking
        for (const action of queuedActions) {
          try {
            ActionFSM.guard(action.status as any, 'running')
          } catch (fsmError) {
            console.error(`Invalid state transition for action ${action.id}: ${action.status} -> running`)
            throw new Error(`Cannot lock action ${action.id}: ${fsmError instanceof Error ? fsmError.message : 'Invalid state transition'}`)
          }
        }

        // Lock the actions by updating their status and startedAt
        const actionIds = queuedActions.map(action => action.id)
        await tx.action.updateMany({
          where: {
            id: { in: actionIds }
          },
          data: {
            status: 'running',
            startedAt: new Date()
          }
        })

        // Return the locked actions with updated status
        return queuedActions.map(action => ({
          ...action,
          status: 'running',
          startedAt: new Date()
        }))
      })
    }

    // Try to get actions immediately
    let actions = await getAndLockActions()
    
    // If no actions and wait > 0, poll the database
    if (actions.length === 0 && wait > 0) {
      const startTime = Date.now()
      const pollInterval = 500 // 500ms between polls
      
      while (actions.length === 0 && (Date.now() - startTime) < (wait * 1000)) {
        // Sleep for poll interval
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        
        // Check for new actions
        actions = await getAndLockActions()
      }
    }

    // If still no actions, return 204 No Content
    if (actions.length === 0) {
      const response = new NextResponse(null, { status: 204 })
      response.headers.set('Connection', 'keep-alive')
      return response
    }

    // Return actions as JSON with keep-alive connection
    const response = NextResponse.json(actions)
    response.headers.set('Connection', 'keep-alive')
    return response

  } catch (error) {
    console.error('Error fetching agent queue:', error)
    
    // Return specific error for FSM validation failures
    if (error instanceof Error && error.message.includes('Cannot lock action')) {
      return createErrorResponse(
        ErrorCodes.ACTION_LOCKED,
        'Action locking failed',
        400
      )
    }
    
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch agent queue',
      500
    )
  }
})
