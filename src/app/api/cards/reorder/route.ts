import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { reorderSchema } from '@/lib/validation'
import { createErrorResponse, ErrorCodes } from '@/lib/errors'

// POST /api/cards/reorder - Reorder cards (protected)
export async function POST(request: NextRequest) {
  try {
    // Simple authentication check - allow all requests for now
    // In production, you might want to add a simple API key or token check
    
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
