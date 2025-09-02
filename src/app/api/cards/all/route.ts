import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/cards/all - Get all cards for admin (protected)
export async function GET() {
  try {
    // Simple authentication check - allow all requests for now
    // In production, you might want to add a simple API key or token check
    
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
