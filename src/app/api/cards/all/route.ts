import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// GET /api/cards/all - Get all cards for admin (protected)
export async function GET() {
  try {
    // Server-side authentication check
    const session = await getServerSession()
    if (!session?.user?.id || session.user.id !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const cards = await prisma.card.findMany({
      orderBy: { order: 'asc' },
      include: {
        status: true,
      },
    })

    return NextResponse.json(cards)
  } catch (error) {
    console.error('Error fetching all cards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    )
  }
}
