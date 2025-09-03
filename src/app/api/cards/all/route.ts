import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, ErrorCodes } from '@/lib/errors'

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
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch cards',
      500
    )
  }
}
