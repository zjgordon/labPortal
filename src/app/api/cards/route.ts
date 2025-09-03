import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCardSchema } from '@/lib/validation'
import { withNoCache, withAdminAuth } from '@/lib/auth/wrappers'
import type { Principal } from '@/lib/auth/principal'
import { verifyOrigin, getAdminCorsHeaders } from '@/lib/auth/csrf-protection'

// GET /api/cards - Public route for enabled cards
export const GET = withNoCache(async () => {
  try {
    const cards = await prisma.card.findMany({
      where: { isEnabled: true },
      orderBy: [
        { group: 'asc' },
        { order: 'asc' }
      ],
      include: {
        status: true,
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

    return NextResponse.json(cards)
  } catch (error) {
    console.error('Error fetching cards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    )
  }
})

// POST /api/cards - Create new card (admin protected)
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
      include: {
        status: true,
      },
    })

    return NextResponse.json(card, { status: 201 })
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
