import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { withAgentAuth } from '@/lib/auth/wrappers'
import type { Principal } from '@/lib/auth/principal'
import { z } from 'zod'
import { ActionFSM } from '@/lib/control/fsm'
import { createErrorResponse, ErrorCodes } from '@/lib/errors'

const prisma = new PrismaClient()

// Validation schema for action reports
const actionReportSchema = z.object({
  actionId: z.string().min(1, "Action ID is required"),
  status: z.enum(['running', 'succeeded', 'failed'], {
    errorMap: () => ({ message: "Status must be one of: running, succeeded, failed" })
  }),
  exitCode: z.number().int().optional(),
  message: z.string().max(1000, "Message too long").optional()
})

/**
 * POST /api/control/report - Report action status update
 */
export const POST = withAgentAuth(async (request: NextRequest, principal: Principal) => {
  try {
    // The principal is already validated and contains the hostId
    if (principal.type !== 'agent') {
      throw new Error('Expected agent principal')
    }
    const { hostId } = principal

    const body = await request.json()
    
    // Validate input
    const validatedData = actionReportSchema.parse(body)
    
    // Check if action exists and belongs to this host
    const action = await prisma.action.findUnique({
      where: { id: validatedData.actionId },
      include: {
        host: true,
        service: true
      }
    })
    
    if (!action) {
      return createErrorResponse(
        ErrorCodes.NOT_FOUND,
        'Action not found',
        404
      )
    }
    
    if (action.hostId !== hostId) {
      return createErrorResponse(
        ErrorCodes.HOST_MISMATCH,
        'Action does not belong to this host',
        403
      )
    }

    // Validate state transition using FSM
    try {
      ActionFSM.guard(action.status as any, validatedData.status)
    } catch (fsmError) {
      return createErrorResponse(
        ErrorCodes.INVALID_STATE_TRANSITION,
        `Invalid state transition from ${action.status} to ${validatedData.status}`,
        400
      )
    }
    
    // Update action status
    const updateData: any = {
      status: validatedData.status
    }
    
    // Set startedAt if transitioning to running
    if (validatedData.status === 'running' && !action.startedAt) {
      updateData.startedAt = new Date()
    }
    
    // Set finishedAt if transitioning to completed/failed
    if (['succeeded', 'failed'].includes(validatedData.status) && !action.finishedAt) {
      updateData.finishedAt = new Date()
    }
    
    // Set exit code and message if provided
    if (validatedData.exitCode !== undefined) {
      updateData.exitCode = validatedData.exitCode
    }
    
    if (validatedData.message !== undefined) {
      updateData.message = validatedData.message
    }
    
    // Update the action
    const updatedAction = await prisma.action.update({
      where: { id: validatedData.actionId },
      data: updateData,
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

    return NextResponse.json(updatedAction)
  } catch (error) {
    console.error('Error reporting action status:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Validation error',
        400
      )
    }
    
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to report action status',
      500
    )
  }
})
