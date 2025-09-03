import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAdminAuth, rejectAgentTokens } from '@/lib/auth'
import { createServiceSchema } from '@/lib/validation'
import { verifyOrigin, createCsrfErrorResponse } from '@/lib/auth/csrf-protection'

const prisma = new PrismaClient()

/**
 * GET /api/services - Get all services
 */
export async function GET(request: NextRequest) {
  try {
    // Reject agent tokens on admin endpoints
    const agentRejection = await rejectAgentTokens(request)
    if (agentRejection) return agentRejection
    
    // Check admin authentication
    const authError = await requireAdminAuth(request)
    if (authError) return authError

    const services = await prisma.managedService.findMany({
      include: {
        host: true,
        card: true,
        _count: {
          select: {
            actions: true
          }
        }
      },
      orderBy: [
        { host: { name: 'asc' } },
        { unitName: 'asc' }
      ]
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/services - Create a new service
 */
export async function POST(request: NextRequest) {
  try {
    // Reject agent tokens on admin endpoints
    const agentRejection = await rejectAgentTokens(request)
    if (agentRejection) return agentRejection
    
    // Check admin authentication
    const authError = await requireAdminAuth(request)
    if (authError) return authError
    
    // CSRF protection for state-changing methods
    if (!verifyOrigin(request)) {
      return createCsrfErrorResponse(request)
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = createServiceSchema.parse(body)
    
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
    
    // Check if card exists (if provided)
    if (validatedData.cardId) {
      const card = await prisma.card.findUnique({
        where: { id: validatedData.cardId }
      })
      
      if (!card) {
        return NextResponse.json(
          { error: 'Card not found' },
          { status: 400 }
        )
      }
    }
    
    // Check if service with same unit name already exists on this host
    const existingService = await prisma.managedService.findUnique({
      where: {
        hostId_unitName: {
          hostId: validatedData.hostId,
          unitName: validatedData.unitName
        }
      }
    })
    
    if (existingService) {
      return NextResponse.json(
        { error: 'Service with this unit name already exists on this host' },
        { status: 400 }
      )
    }
    
    // Create service
    const service = await prisma.managedService.create({
      data: {
        cardId: validatedData.cardId,
        hostId: validatedData.hostId,
        unitName: validatedData.unitName,
        displayName: validatedData.displayName,
        description: validatedData.description,
        allowStart: validatedData.allowStart,
        allowStop: validatedData.allowStop,
        allowRestart: validatedData.allowRestart,
      },
      include: {
        host: true,
        card: true,
        _count: {
          select: {
            actions: true
          }
        }
      }
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    )
  }
}
