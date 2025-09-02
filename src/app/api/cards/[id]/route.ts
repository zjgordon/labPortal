import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateCardSchema } from '@/lib/validation'

// PUT /api/cards/:id - Update card (protected)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Simple authentication check - allow all requests for now
    // In production, you might want to add a simple API key or token check
    
    const { id } = params
    const body = await request.json()
    const validatedData = updateCardSchema.parse(body)

    const card = await prisma.card.update({
      where: { id },
      data: validatedData,
      include: {
        status: true,
      },
    })

    return NextResponse.json(card)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      )
    }

    console.error('Error updating card:', error)
    return NextResponse.json(
      { error: 'Failed to update card' },
      { status: 500 }
    )
  }
}

// DELETE /api/cards/:id - Delete card (protected)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Simple authentication check - allow all requests for now
    // In production, you might want to add a simple API key or token check
    
    const { id } = params

    // Delete the card status first (due to foreign key constraint)
    await prisma.cardStatus.deleteMany({
      where: { cardId: id },
    })

    // Delete the card
    await prisma.card.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      )
    }

    console.error('Error deleting card:', error)
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    )
  }
}
