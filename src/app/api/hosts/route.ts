import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHostSchema } from '@/lib/validation'
import { withAdminAuth } from '@/lib/auth/wrappers'
import type { Principal } from '@/lib/auth/principal'
import { verifyOrigin, getAdminCorsHeaders } from '@/lib/auth/csrf-protection'

/**
 * GET /api/hosts - Get all hosts
 */
export const GET = withAdminAuth(async (request: NextRequest, principal: Principal) => {
  try {
    const hosts = await prisma.host.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Remove sensitive token data and return only prefix + rotation date
    const sanitizedHosts = hosts.map(host => ({
      ...host,
      agentTokenPrefix: host.agentTokenPrefix,
      tokenRotatedAt: host.tokenRotatedAt,
      // Explicitly exclude agentTokenHash
      agentTokenHash: undefined
    }))

    return NextResponse.json(sanitizedHosts)
  } catch (error) {
    console.error('Error fetching hosts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hosts' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/hosts - Create a new host
 */
export const POST = withAdminAuth(async (request: NextRequest, principal: Principal) => {
  try {
    // CSRF protection for state-changing methods
    if (!verifyOrigin(request)) {
      return NextResponse.json(
        { error: 'CSRF protection: Invalid origin' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
    // Validate input
    const validatedData = createHostSchema.parse(body)
    
    // Check if host name already exists
    const existingHost = await prisma.host.findFirst({
      where: { name: validatedData.name }
    })
    
    if (existingHost) {
      return NextResponse.json(
        { error: 'Host with this name already exists' },
        { status: 400 }
      )
    }
    
    // Create host
    const host = await prisma.host.create({
      data: {
        name: validatedData.name,
        address: validatedData.address,
        // Note: agentToken is no longer supported
        // Use POST /api/hosts/:id/token for token management
      },
      include: {
        services: true,
        _count: {
          select: {
            services: true,
            actions: true
          }
        }
      }
    })

    return NextResponse.json(host, { status: 201 })
  } catch (error) {
    console.error('Error creating host:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create host' },
      { status: 500 }
    )
  }
})
