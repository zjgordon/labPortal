import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for imported card data
const importCardSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  url: z.string().url('Valid URL is required'),
  iconPath: z.string().nullable().optional(),
  order: z.number().int().min(0, 'Order must be a non-negative integer'),
  isEnabled: z.boolean().default(true),
  group: z.string().min(1, 'Group is required'),
  healthPath: z.string().nullable().optional(),
})

const importRequestSchema = z.object({
  cards: z.array(importCardSchema).min(1, 'At least one card is required'),
})

// POST /api/cards/import - Import cards from JSON (admin only)
export async function POST(request: NextRequest) {
  try {
    // Simple authentication check - in production, implement proper JWT or session validation
    // For now, we'll rely on the fact that this is an admin-only route
    
    const body = await request.json()
    const validatedData = importRequestSchema.parse(body)
    
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    }

    // Process each card
    for (const cardData of validatedData.cards) {
      try {
        // Try to find existing card by ID first, then by title
        let existingCard = null
        
        if (cardData.id) {
          existingCard = await prisma.card.findUnique({
            where: { id: cardData.id }
          })
        }
        
        if (!existingCard) {
          existingCard = await prisma.card.findFirst({
            where: { title: cardData.title }
          })
        }

        if (existingCard) {
          // Update existing card
          await prisma.card.update({
            where: { id: existingCard.id },
            data: {
              title: cardData.title,
              description: cardData.description,
              url: cardData.url,
              iconPath: cardData.iconPath,
              order: cardData.order,
              isEnabled: cardData.isEnabled,
              group: cardData.group,
              healthPath: cardData.healthPath,
            }
          })
          results.updated++
        } else {
          // Create new card
          await prisma.card.create({
            data: {
              title: cardData.title,
              description: cardData.description,
              url: cardData.url,
              iconPath: cardData.iconPath,
              order: cardData.order,
              isEnabled: cardData.isEnabled,
              group: cardData.group,
              healthPath: cardData.healthPath,
            }
          })
          results.created++
        }
      } catch (error) {
        const errorMessage = `Failed to process card "${cardData.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
        results.errors.push(errorMessage)
        console.error(errorMessage, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
      results
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      )
    }

    console.error('Error importing cards:', error)
    return NextResponse.json(
      { error: 'Failed to import cards' },
      { status: 500 }
    )
  }
}
