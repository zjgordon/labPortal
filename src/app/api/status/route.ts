import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { probeUrl } from '@/lib/probe'
import { statusQuerySchema } from '@/lib/validation'
import { createErrorResponse, ErrorCodes } from '@/lib/errors'

// GET /api/status?cardId=... - Check card status with enhanced caching and fail tracking
export const GET = async (request: NextRequest) => {
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
      const response = createErrorResponse(
        ErrorCodes.NOT_FOUND,
        'Card not found',
        404
      )
      response.headers.set('Cache-Control', 'max-age=5, stale-while-revalidate=30')
      return response
    }
    
    if (!card.isEnabled) {
      const response = createErrorResponse(
        ErrorCodes.FORBIDDEN,
        'Card is disabled',
        400
      )
      response.headers.set('Cache-Control', 'max-age=5, stale-while-revalidate=30')
      return response
    }
    
    const now = new Date()
    
    // Check if we should return cached status
    if (card.status) {
      // If nextCheckAt is set and we haven't reached it yet, return cached
      if (card.status.nextCheckAt && now < new Date(card.status.nextCheckAt)) {
        const response = NextResponse.json({
          isUp: card.status.isUp,
          lastChecked: card.status.lastChecked,
          lastHttp: card.status.lastHttp,
          latencyMs: card.status.latencyMs,
          message: card.status.message,
          failCount: card.status.failCount,
          nextCheckAt: card.status.nextCheckAt,
        })
        response.headers.set('Cache-Control', 'max-age=5, stale-while-revalidate=30')
        return response
      }
      
      // If lastChecked is less than 30 seconds ago, return cached
      if (card.status.lastChecked) {
        const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000)
        const lastCheckedDate = new Date(card.status.lastChecked)
        if (lastCheckedDate > thirtySecondsAgo) {
          const response = NextResponse.json({
            isUp: card.status.isUp,
            lastChecked: card.status.lastChecked,
            lastHttp: card.status.lastHttp,
            latencyMs: card.status.latencyMs,
            message: card.status.message,
            failCount: card.status.failCount,
            nextCheckAt: card.status.nextCheckAt,
          })
          response.headers.set('Cache-Control', 'max-age=5, stale-while-revalidate=30')
          return response
        }
      }
    }
    
    // Probe the URL with a reasonable timeout
    const probeResult = await probeUrl(card.url, card.healthPath, 3000)
    
    // Calculate new failCount and nextCheckAt
    let newFailCount = card.status?.failCount || 0
    let newNextCheckAt: Date | null = null
    
    if (probeResult.isUp) {
      // Service is up, reset failCount
      newFailCount = 0
    } else {
      // Service is down, increment failCount
      newFailCount = (card.status?.failCount || 0) + 1
      
      // If failCount >= 3, set nextCheckAt to 60 seconds from now
      if (newFailCount >= 3) {
        newNextCheckAt = new Date(now.getTime() + 60 * 1000)
      }
    }
    
    // Update or create CardStatus
    const updatedStatus = await prisma.cardStatus.upsert({
      where: { cardId: card.id },
      update: {
        isUp: probeResult.isUp,
        lastChecked: now,
        lastHttp: probeResult.lastHttp,
        latencyMs: probeResult.latencyMs,
        message: probeResult.message,
        failCount: newFailCount,
        nextCheckAt: newNextCheckAt,
      },
      create: {
        cardId: card.id,
        isUp: probeResult.isUp,
        lastChecked: now,
        lastHttp: probeResult.lastHttp,
        latencyMs: probeResult.latencyMs,
        message: probeResult.message,
        failCount: newFailCount,
        nextCheckAt: newNextCheckAt,
      },
    })

    // Create StatusEvent record for history tracking
    await prisma.statusEvent.create({
      data: {
        cardId: card.id,
        isUp: probeResult.isUp,
        http: probeResult.lastHttp,
        latencyMs: probeResult.latencyMs,
        message: probeResult.message,
      }
    })
    
    // Log the status check result
    console.log(`Status check for card ${card.title} (${card.url}): ${probeResult.isUp ? 'UP' : 'DOWN'} - ${probeResult.latencyMs}ms - ${probeResult.message} - Fail count: ${newFailCount}`)
    
    // Return the status
    const response = NextResponse.json({
      isUp: updatedStatus.isUp,
      lastChecked: updatedStatus.lastChecked,
      lastHttp: updatedStatus.lastHttp,
      latencyMs: updatedStatus.latencyMs,
      message: updatedStatus.message,
      failCount: updatedStatus.failCount,
      nextCheckAt: updatedStatus.nextCheckAt,
    })
    response.headers.set('Cache-Control', 'max-age=5, stale-while-revalidate=30')
    return response
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const response = createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid query parameters',
        400
      )
      response.headers.set('Cache-Control', 'max-age=5, stale-while-revalidate=30')
      return response
    }
    
    console.error('Error checking card status:', error)
    const response = createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to check card status',
      500
    )
    response.headers.set('Cache-Control', 'max-age=5, stale-while-revalidate=30')
    return response
  }
}
