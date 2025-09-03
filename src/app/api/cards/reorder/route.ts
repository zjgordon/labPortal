import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { reorderSchema } from '@/lib/validation'
import { createErrorResponse, ErrorCodes } from '@/lib/errors'
import { verifyOrigin, createCsrfErrorResponse } from '@/lib/auth/csrf-protection'
import { getServerSession } from 'next-auth'

// POST /api/cards/reorder - Reorder cards (protected)
export async function POST(request: NextRequest) {
  try {
    // Admin authentication check
    const session = await getServerSession()
    if (!session?.user?.id || session.user.id !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // CSRF protection for state-changing methods
    if (!verifyOrigin(request)) {
      return createCsrfErrorResponse(request)
    }
    
    const body = await request.json()
    const validatedData = reorderSchema.parse(body)

    // Update all cards with new order values and groups
    const updatePromises = validatedData.cards.map(({ id, order, group }) =>
      prisma.card.update({
        where: { id },
        data: { order, group },
      })
    )

    await prisma.$transaction(updatePromises)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Validation failed',
        400
      )
    }

    console.error('Error reordering cards:', error)
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to reorder cards',
      500
    )
  }
}
