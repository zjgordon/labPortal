import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAdminAuth, rejectAgentTokens } from '@/lib/auth'
import { createActionSchema } from '@/lib/validation'
import { getServerSession } from 'next-auth'
import { LOCAL_ACTION_CONFIG } from '@/lib/env'
import { SystemctlExecutor } from '@/lib/systemctl-executor'

const prisma = new PrismaClient()

/**
 * POST /api/control/actions - Create a control action
 */
export async function POST(request: NextRequest) {
  try {
    // Reject agent tokens on admin endpoints
    const agentRejection = await rejectAgentTokens(request)
    if (agentRejection) return agentRejection
    
    // Check admin authentication
    const authError = await requireAdminAuth(request)
    if (authError) return authError

    const body = await request.json()
    
    // Validate input
    const validatedData = createActionSchema.parse(body)
    
    // Get the current session for requestedBy
    const session = await getServerSession()
    const requestedBy = session?.user?.email || 'admin@local'
    
    // Check if host exists
    const host = await prisma.host.findUnique({
      where: { id: validatedData.hostId }
    })
    
    if (!host) {
      return NextResponse.json(
        { error: 'Host not found' },
        { status: 400 }
      )
    }
    
    // Check if service exists and get its permissions
    const service = await prisma.managedService.findUnique({
      where: { id: validatedData.serviceId },
      include: {
        host: true
      }
    })
    
    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 400 }
      )
    }
    
    // Verify the service belongs to the specified host
    if (service.hostId !== validatedData.hostId) {
      return NextResponse.json(
        { error: 'Service does not belong to the specified host' },
        { status: 400 }
      )
    }
    
    // Check if the action is allowed based on service permissions
    switch (validatedData.kind) {
      case 'start':
        if (!service.allowStart) {
          return NextResponse.json(
            { error: 'Start action not allowed for this service' },
            { status: 400 }
          )
        }
        break
      case 'stop':
        if (!service.allowStop) {
          return NextResponse.json(
            { error: 'Stop action not allowed for this service' },
            { status: 400 }
          )
        }
        break
      case 'restart':
        if (!service.allowRestart) {
          return NextResponse.json(
            { error: 'Restart action not allowed for this service' },
            { status: 400 }
          )
        }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action kind' },
          { status: 400 }
        )
    }
    
    // Create the action
    const action = await prisma.action.create({
      data: {
        hostId: validatedData.hostId,
        serviceId: validatedData.serviceId,
        kind: validatedData.kind,
        status: 'queued',
        requestedBy,
        requestedAt: new Date()
      },
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

    // Check if this is a local action that should be executed immediately
    if (validatedData.hostId === LOCAL_ACTION_CONFIG.HOST_LOCAL_ID) {
      try {
        // Update action to running
        await prisma.action.update({
          where: { id: action.id },
          data: {
            status: 'running',
            startedAt: new Date()
          }
        })

        // Execute the systemctl command
        const allowSystemctl = LOCAL_ACTION_CONFIG.ALLOW_SYSTEMCTL && 
          SystemctlExecutor.isSystemService(service.unitName)
        
        const result = await SystemctlExecutor.execute(
          validatedData.kind,
          service.unitName,
          allowSystemctl
        )

        // Update action with results
        const finalStatus = result.success ? 'completed' : 'failed'
        const updatedAction = await prisma.action.update({
          where: { id: action.id },
          data: {
            status: finalStatus,
            finishedAt: new Date(),
            exitCode: result.exitCode,
            message: result.message
          },
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

        return NextResponse.json(updatedAction, { status: 201 })
      } catch (error) {
        // If execution fails, mark action as failed
        console.error('Error executing local action:', error)
        const failedAction = await prisma.action.update({
          where: { id: action.id },
          data: {
            status: 'failed',
            finishedAt: new Date(),
            exitCode: -1,
            message: `Failed to execute action: ${error instanceof Error ? error.message : 'Unknown error'}`
          },
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

        return NextResponse.json(failedAction, { status: 201 })
      }
    }

    // Return the queued action for remote hosts
    return NextResponse.json(action, { status: 201 })
  } catch (error) {
    console.error('Error creating control action:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create control action' },
      { status: 500 }
    )
  }
}
