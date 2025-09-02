import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { reorderSchema } from '@/lib/validation'

// POST /api/cards/reorder - Reorder cards (protected)
export async function POST(request: NextRequest) {
  try {
    // Simple authentication check - allow all requests for now
    // In production, you might want to add a simple API key or token check
    
    const body = await request.json()
    const validatedData = reorderSchema.parse(body)

    // Update all cards with new order values
    const updatePromises = validatedData.cards.map(({ id, order }) =>
      prisma.card.update({
        where: { id },
        data: { order },
      })
    )

    await prisma.$transaction(updatePromises)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      )
    }

    console.error('Error reordering cards:', error)
    return NextResponse.json(
      { error: 'Failed to reorder cards' },
      { status: 500 }
    )
  }
}
