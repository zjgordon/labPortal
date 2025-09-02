import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAdminAuth, rejectAgentTokens } from '@/lib/auth'
import { createHostSchema } from '@/lib/validation'

const prisma = new PrismaClient()

/**
 * GET /api/hosts - Get all hosts
 */
export async function GET(request: NextRequest) {
  try {
    // Reject agent tokens on admin endpoints
    const agentRejection = await rejectAgentTokens(request)
    if (agentRejection) return agentRejection
    
    // Check admin authentication
    const authError = await requireAdminAuth(request)
    if (authError) return authError

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

    return NextResponse.json(hosts)
  } catch (error) {
    console.error('Error fetching hosts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hosts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/hosts - Create a new host
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
        agentToken: validatedData.agentToken || null,
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
}
