import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ResponseOptimizer } from '@/lib/response-optimizer'

/**
 * GET /api/status/summary
 * Returns uptime summary for all enabled cards (24h and 7d)
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    // Get all enabled cards with their current status
    const cards = await prisma.card.findMany({
      where: { isEnabled: true },
      select: {
        id: true,
        title: true,
        group: true,
        order: true,
        status: {
          select: {
            isUp: true,
            lastChecked: true,
            latencyMs: true,
            message: true,
          }
        },
      },
      orderBy: { order: 'asc' },
    })
    
    const summary = await Promise.all(
      cards.map(async (card) => {
        // Get 24h uptime
        const dayEvents = await prisma.statusEvent.count({
          where: {
            cardId: card.id,
            timestamp: { gte: dayAgo },
          },
        })
        
        const dayUpEvents = await prisma.statusEvent.count({
          where: {
            cardId: card.id,
            timestamp: { gte: dayAgo },
            isUp: true,
          },
        })
        
        const dayUptime = dayEvents > 0 ? (dayUpEvents / dayEvents) * 100 : 0
        
        // Get 7d uptime
        const weekEvents = await prisma.statusEvent.count({
          where: {
            cardId: card.id,
            timestamp: { gte: weekAgo },
          },
        })
        
        const weekUpEvents = await prisma.statusEvent.count({
          where: {
            cardId: card.id,
            timestamp: { gte: weekAgo },
            isUp: true,
          },
        })
        
        const weekUptime = weekEvents > 0 ? (weekUpEvents / weekEvents) * 100 : 0
        
        // Get average latency for the last 24h
        const dayLatencyEvents = await prisma.statusEvent.findMany({
          where: {
            cardId: card.id,
            timestamp: { gte: dayAgo },
            latencyMs: { not: null },
          },
          select: { latencyMs: true },
        })
        
        const avgLatency = dayLatencyEvents.length > 0
          ? dayLatencyEvents.reduce((sum, e) => sum + (e.latencyMs || 0), 0) / dayLatencyEvents.length
          : null
        
        return {
          id: card.id,
          title: card.title,
          group: card.group,
          currentStatus: {
            isUp: card.status?.isUp ?? false,
            lastChecked: card.status?.lastChecked?.toISOString() ?? null,
            latencyMs: card.status?.latencyMs ?? null,
            message: card.status?.message ?? null,
          },
          uptime: {
            '24h': Math.round(dayUptime * 100) / 100, // Round to 2 decimal places
            '7d': Math.round(weekUptime * 100) / 100,
          },
          metrics: {
            totalChecks24h: dayEvents,
            totalChecks7d: weekEvents,
            avgLatency24h: avgLatency ? Math.round(avgLatency) : null,
          },
        }
      })
    )
    
    // Calculate overall statistics
    const totalCards = summary.length
    const upCards = summary.filter(c => c.currentStatus.isUp).length
    const overallUptime24h = summary.reduce((sum, c) => sum + c.uptime['24h'], 0) / totalCards
    const overallUptime7d = summary.reduce((sum, c) => sum + c.uptime['7d'], 0) / totalCards
    
    return NextResponse.json({
      timestamp: now.toISOString(),
      overall: {
        totalCards,
        upCards,
        downCards: totalCards - upCards,
        uptime24h: Math.round(overallUptime24h * 100) / 100,
        uptime7d: Math.round(overallUptime7d * 100) / 100,
      },
      cards: summary,
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=5, stale-while-revalidate=30'
      }
    })
    
  } catch (error) {
    console.error('Error fetching status summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch status summary' },
      { status: 500 }
    )
  }
}

