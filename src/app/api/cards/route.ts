import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCardSchema } from '@/lib/validation'
import { withAdminAuth } from '@/lib/auth/wrappers'
import type { Principal } from '@/lib/auth/principal'
import { verifyOrigin, getAdminCorsHeaders } from '@/lib/auth/csrf-protection'
import { createErrorResponse, ErrorCodes } from '@/lib/errors'

// GET /api/cards - Public route for enabled cards
export const GET = async () => {
  try {
    const cards = await prisma.card.findMany({
      where: { isEnabled: true },
      orderBy: [
        { group: 'asc' },
        { order: 'asc' }
      ],
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        iconPath: true,
        order: true,
        group: true,
        healthPath: true,
        status: {
          select: {
            isUp: true,
            lastChecked: true,
            lastHttp: true,
            latencyMs: true,
            message: true,
            failCount: true,
            nextCheckAt: true,
          }
        },
        services: {
          select: {
            id: true,
            unitName: true,
            displayName: true,
            allowStart: true,
            allowStop: true,
            allowRestart: true,
            host: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(cards, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=5, stale-while-revalidate=30'
      }
    })
  } catch (error) {
    console.error('Error fetching cards:', error)
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch cards',
      500
    )
  }
}

// POST /api/cards - Create new card (admin protected)
export const POST = withAdminAuth(async (request: NextRequest, principal: Principal) => {
  try {
    // CSRF protection for state-changing methods
    if (!verifyOrigin(request)) {
      return createErrorResponse(
        ErrorCodes.FORBIDDEN,
        'CSRF protection: Invalid origin',
        403
      )
    }
    
    const body = await request.json()
    const validatedData = createCardSchema.parse(body)

    // Get the highest order value and add 1
    const maxOrder = await prisma.card.aggregate({
      _max: { order: true }
    })
    const newOrder = (maxOrder._max.order || 0) + 1

    const card = await prisma.card.create({
      data: {
        ...validatedData,
        order: newOrder,
      },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        iconPath: true,
        order: true,
        isEnabled: true,
        group: true,
        healthPath: true,
        createdAt: true,
        updatedAt: true,
        status: {
          select: {
            isUp: true,
            lastChecked: true,
            lastHttp: true,
            latencyMs: true,
            message: true,
            failCount: true,
            nextCheckAt: true,
          }
        },
      },
    })

    return NextResponse.json(card, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      )
    }

    console.error('Error creating card:', error)
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    )
  }
})
