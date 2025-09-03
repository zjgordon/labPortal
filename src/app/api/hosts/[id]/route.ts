import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPrincipal, createPrincipalError } from '@/lib/auth/principal'
import { updateHostSchema } from '@/lib/validation'
import { verifyOrigin, getAdminCorsHeaders } from '@/lib/auth/csrf-protection'

/**
 * PUT /api/hosts/:id - Update a host
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate admin authentication
    const principal = await getPrincipal(request, { require: 'admin' })
    
    // CSRF protection for state-changing methods
    if (!verifyOrigin(request)) {
      return NextResponse.json(
        { error: 'CSRF protection: Invalid origin' },
        { status: 403 }
      )
    }
    
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
    
    // Update host (note: agentToken is no longer supported)
    const updatedHost = await prisma.host.update({
      where: { id },
      data: {
        name: validatedData.name,
        address: validatedData.address,
        // agentToken is no longer supported - use POST /api/hosts/:id/token for token management
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

    const response = NextResponse.json(updatedHost)
    response.headers.set('Cache-Control', 'no-store')
    return response
  } catch (error) {
    if (error instanceof Error) {
      return createPrincipalError(error) as NextResponse
    }
    
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
    // Validate admin authentication
    const principal = await getPrincipal(request, { require: 'admin' })
    
    // CSRF protection for state-changing methods
    if (!verifyOrigin(request)) {
      return NextResponse.json(
        { error: 'CSRF protection: Invalid origin' },
        { status: 403 }
      )
    }
    
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

    const response = NextResponse.json({ message: 'Host deleted successfully' })
    response.headers.set('Cache-Control', 'no-store')
    return response
  } catch (error) {
    if (error instanceof Error) {
      return createPrincipalError(error) as NextResponse
    }
    
    console.error('Error deleting host:', error)
    return NextResponse.json(
      { error: 'Failed to delete host' },
      { status: 500 }
    )
  }
}
