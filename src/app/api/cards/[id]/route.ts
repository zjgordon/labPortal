import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateCardSchema } from '@/lib/validation'
import { createErrorResponse, ErrorCodes } from '@/lib/errors'
import { ResponseOptimizer } from '@/lib/response-optimizer'

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

    return NextResponse.json(card, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Validation failed',
        400
      )
    }

    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return createErrorResponse(
        ErrorCodes.NOT_FOUND,
        'Card not found',
        404
      )
    }

    console.error('Error updating card:', error)
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to update card',
      500
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

    return NextResponse.json({ success: true }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return createErrorResponse(
        ErrorCodes.NOT_FOUND,
        'Card not found',
        404
      )
    }

    console.error('Error deleting card:', error)
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to delete card',
      500
    )
  }
}
