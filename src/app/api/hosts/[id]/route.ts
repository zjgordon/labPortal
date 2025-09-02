import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAdminAuth, rejectAgentTokens } from '@/lib/auth'
import { updateHostSchema } from '@/lib/validation'

const prisma = new PrismaClient()

/**
 * PUT /api/hosts/:id - Update a host
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
    const validatedData = updateHostSchema.parse(body)
    
    // Check if host exists
    const existingHost = await prisma.host.findUnique({
      where: { id }
    })
    
    if (!existingHost) {
      return NextResponse.json(
        { error: 'Host not found' },
        { status: 404 }
      )
    }
    
    // If name is being updated, check for conflicts
    if (validatedData.name && validatedData.name !== existingHost.name) {
      const nameConflict = await prisma.host.findFirst({
        where: { 
          name: validatedData.name,
          id: { not: id }
        }
      })
      
      if (nameConflict) {
        return NextResponse.json(
          { error: 'Host with this name already exists' },
          { status: 400 }
        )
      }
    }
    
    // Update host
    const updatedHost = await prisma.host.update({
      where: { id },
      data: {
        name: validatedData.name,
        address: validatedData.address,
        agentToken: validatedData.agentToken,
      },
      include: {
        services: {
          include: {
            card: true
          }
        },
        _count: {
          select: {
            services: true,
            actions: true
          }
        }
      }
    })

    return NextResponse.json(updatedHost)
  } catch (error) {
    console.error('Error updating host:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update host' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/hosts/:id - Delete a host
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
    
    // Check if host exists
    const existingHost = await prisma.host.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            services: true,
            actions: true
          }
        }
      }
    })
    
    if (!existingHost) {
      return NextResponse.json(
        { error: 'Host not found' },
        { status: 404 }
      )
    }
    
    // Check if host has services or actions
    if (existingHost._count.services > 0 || existingHost._count.actions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete host with existing services or actions. Remove them first.' },
        { status: 400 }
      )
    }
    
    // Delete host
    await prisma.host.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Host deleted successfully' })
  } catch (error) {
    console.error('Error deleting host:', error)
    return NextResponse.json(
      { error: 'Failed to delete host' },
      { status: 500 }
    )
  }
}
