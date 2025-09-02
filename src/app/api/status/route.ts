import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { probeUrl } from '@/lib/probe'
import { statusQuerySchema } from '@/lib/validation'

// GET /api/status?cardId=... - Check card status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cardId = searchParams.get('cardId')
    
    // Validate query parameters
    const validatedParams = statusQuerySchema.parse({ cardId })
    
    // Look up the card
    const card = await prisma.card.findUnique({
      where: { id: validatedParams.cardId },
      include: { status: true },
    })
    
    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      )
    }
    
    if (!card.isEnabled) {
      return NextResponse.json(
        { error: 'Card is disabled' },
        { status: 400 }
      )
    }
    
    const now = new Date()
    const tenSecondsAgo = new Date(now.getTime() - 10 * 1000) // Reduced from 30s to 10s for more responsive updates
    
    // Check if we have recent status data (less than 10 seconds old)
    if (card.status && card.status.lastChecked && card.status.lastChecked > tenSecondsAgo) {
      // Return cached status
      return NextResponse.json({
        isUp: card.status.isUp,
        lastChecked: card.status.lastChecked,
        lastHttp: card.status.lastHttp,
        latencyMs: card.status.latencyMs,
      })
    }
    
    // Probe the URL with a reasonable timeout
    const probeResult = await probeUrl(card.url, 8000)
    
    // Update or create CardStatus
    const updatedStatus = await prisma.cardStatus.upsert({
      where: { cardId: card.id },
      update: {
        isUp: probeResult.isUp,
        lastChecked: now,
        lastHttp: probeResult.lastHttp,
        latencyMs: probeResult.latencyMs,
        message: probeResult.message,
      },
      create: {
        cardId: card.id,
        isUp: probeResult.isUp,
        lastChecked: now,
        lastHttp: probeResult.lastHttp,
        latencyMs: probeResult.latencyMs,
        message: probeResult.message,
      },
    })
    
    // Log the status check result
    console.log(`Status check for card ${card.title} (${card.url}): ${probeResult.isUp ? 'UP' : 'DOWN'} - ${probeResult.latencyMs}ms - ${probeResult.message}`)
    
    // Return the status
    return NextResponse.json({
      isUp: updatedStatus.isUp,
      lastChecked: updatedStatus.lastChecked,
      lastHttp: updatedStatus.lastHttp,
        latencyMs: updatedStatus.latencyMs,
    })
    
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.message },
        { status: 400 }
      )
    }
    
    console.error('Error checking card status:', error)
    return NextResponse.json(
      { error: 'Failed to check card status' },
      { status: 500 }
    )
  }
}
