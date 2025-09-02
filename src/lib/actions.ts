"use server"

import { prisma } from "@/lib/prisma"

export interface Card {
  id: string
  title: string
  description: string
  url: string
  iconPath: string | null
  order: number
  isEnabled: boolean
  group: string
}

export async function getEnabledCards(): Promise<Card[]> {
  try {
    const cards = await prisma.card.findMany({
      where: { isEnabled: true },
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
      },
    })
    
    return cards
  } catch (error) {
    console.error('Failed to fetch enabled cards:', error)
    return []
  }
}
