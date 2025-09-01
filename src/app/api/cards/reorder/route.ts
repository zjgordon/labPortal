import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { reorderSchema } from '@/lib/validation'



// POST /api/cards/reorder - Reorder cards (protected)
export async function POST(request: NextRequest) {
  try {
    // Server-side authentication check
    const session = await getServerSession()
    if (!session?.user?.id || session.user.id !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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
