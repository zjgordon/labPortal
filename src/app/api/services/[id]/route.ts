import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAdminAuth, rejectAgentTokens } from '@/lib/auth'
import { updateServiceSchema } from '@/lib/validation'

const prisma = new PrismaClient()

/**
 * PUT /api/services/:id - Update a service
 */
export async function PUT(
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
    const body = await request.json()
    
    // Validate input
    const validatedData = updateServiceSchema.parse(body)
    
    // Check if service exists
    const existingService = await prisma.managedService.findUnique({
      where: { id }
    })
    
    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }
    
    // Check if host exists (if being updated)
    if (validatedData.hostId && validatedData.hostId !== existingService.hostId) {
      const host = await prisma.host.findUnique({
        where: { id: validatedData.hostId }
      })
      
      if (!host) {
        return NextResponse.json(
          { error: 'Host not found' },
          { status: 400 }
        )
      }
    }
    
    // Check if card exists (if being updated)
    if (validatedData.cardId !== undefined && validatedData.cardId !== existingService.cardId) {
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
    }
    
    // Check for unit name conflicts if being updated
    if (validatedData.unitName && validatedData.unitName !== existingService.unitName) {
      const unitNameConflict = await prisma.managedService.findFirst({
        where: {
          hostId: validatedData.hostId || existingService.hostId,
          unitName: validatedData.unitName,
          id: { not: id }
        }
      })
      
      if (unitNameConflict) {
        return NextResponse.json(
          { error: 'Service with this unit name already exists on this host' },
          { status: 400 }
        )
      }
    }
    
    // Update service
    const updatedService = await prisma.managedService.update({
      where: { id },
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

    return NextResponse.json(updatedService)
  } catch (error) {
    console.error('Error updating service:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/services/:id - Delete a service
 */
export async function DELETE(
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
    
    // Check if service exists
    const existingService = await prisma.managedService.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            actions: true
          }
        }
      }
    })
    
    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }
    
    // Check if service has actions
    if (existingService._count.actions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete service with existing actions. Remove them first.' },
        { status: 400 }
      )
    }
    
    // Delete service
    await prisma.managedService.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Service deleted successfully' })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    )
  }
}
