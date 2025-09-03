import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, ErrorCodes } from '@/lib/errors'
import { ResponseOptimizer } from '@/lib/response-optimizer'

// GET /api/cards/all - Get all cards for admin (protected)
export async function GET() {
  try {
    // Simple authentication check - allow all requests for now
    // In production, you might want to add a simple API key or token check
    
    const cards = await prisma.card.findMany({
      orderBy: { order: 'asc' },
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
        createdAt: true,
        updatedAt: true,
        status: {
          select: {
            isUp: true,
            lastChecked: true,
            lastHttp: true,
            latencyMs: true,
            message: true,
            failCount: true,
            nextCheckAt: true,
          }
        },
      },
    })

    return NextResponse.json(cards, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    })
  } catch (error) {
    console.error('Error fetching all cards:', error)
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch cards',
      500
    )
  }
}
