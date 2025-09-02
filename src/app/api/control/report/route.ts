import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAgentAuth, getHostFromToken } from '@/lib/auth'
import { z } from 'zod'

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
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      )
    }
    
    if (action.hostId !== host.id) {
      return NextResponse.json(
        { error: 'Action does not belong to this host' },
        { status: 403 }
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
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to report action status' },
      { status: 500 }
    )
  }
}
