import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/cards/export - Export all cards as JSON (admin only)
export async function GET() {
  try {
    // Simple authentication check - in production, implement proper JWT or session validation
    // For now, we'll rely on the fact that this is an admin-only route
    
    const cards = await prisma.card.findMany({
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
        isEnabled: true,
        group: true,
        healthPath: true,
        // Exclude timestamps: createdAt, updatedAt
        // Exclude status data
      },
    })

    return NextResponse.json(cards)
  } catch (error) {
    console.error('Error exporting cards:', error)
    return NextResponse.json(
      { error: 'Failed to export cards' },
      { status: 500 }
    )
  }
}
