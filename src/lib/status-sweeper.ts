import { prisma } from './prisma'
import { probeUrl } from './probe'

interface SweepResult {
  cardId: string
  isUp: boolean
  http?: number
  latencyMs: number
  message?: string
  statusChanged: boolean
}

/**
 * Background service that sweeps all enabled cards and creates status events
 * Runs every 45-60 seconds to warm cache and track status changes
 */
export class StatusSweeper {
  private isRunning = false
  private intervalId: NodeJS.Timeout | null = null
  private lastHeartbeat = new Date()

  /**
   * Start the background sweeper
   */
  start() {
    if (this.isRunning) {
      console.log('StatusSweeper already running')
      return
    }

    this.isRunning = true
    console.log('Starting StatusSweeper...')

    // Initial sweep
    this.sweepAllCards()

    // Set up interval with random jitter (45-60 seconds)
    this.scheduleNextSweep()

    // Heartbeat every 5 minutes
    this.scheduleHeartbeat()
  }

  /**
   * Stop the background sweeper
   */
  stop() {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    console.log('Stopping StatusSweeper...')

    if (this.intervalId) {
      clearTimeout(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Schedule the next sweep with random jitter
   */
  private scheduleNextSweep() {
    if (!this.isRunning) return

    // Random interval between 45-60 seconds
    const minInterval = 45000
    const maxInterval = 60000
    const interval = Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval

    this.intervalId = setTimeout(async () => {
      await this.sweepAllCards()
      this.scheduleNextSweep()
    }, interval)
  }

  /**
   * Schedule heartbeat every 5 minutes
   */
  private scheduleHeartbeat() {
    if (!this.isRunning) return

    setTimeout(async () => {
      await this.heartbeat()
      this.scheduleHeartbeat()
    }, 5 * 60 * 1000) // 5 minutes
  }

  /**
   * Sweep all enabled cards and create status events
   */
  private async sweepAllCards() {
    try {
      console.log(`[${new Date().toISOString()}] Starting status sweep...`)
      
      // Get all enabled cards
      const cards = await prisma.card.findMany({
        where: { isEnabled: true },
        include: { status: true }
      })

      const results: SweepResult[] = []
      
      // Probe each card
      for (const card of cards) {
        try {
          const result = await this.probeCard(card)
          results.push(result)
        } catch (error) {
          console.error(`Error probing card ${card.title}:`, error)
        }
      }

      // Log summary
      const upCount = results.filter(r => r.isUp).length
      const downCount = results.filter(r => !r.isUp).length
      const changedCount = results.filter(r => r.statusChanged).length
      
      console.log(`[${new Date().toISOString()}] Sweep complete: ${upCount} up, ${downCount} down, ${changedCount} status changes`)
      
    } catch (error) {
      console.error('Error during status sweep:', error)
    }
  }

  /**
   * Probe a single card and create status event if status changed
   */
  private async probeCard(card: any): Promise<SweepResult> {
    const startTime = Date.now()
    
    try {
      // Probe the URL
      const probeResult = await probeUrl(card.url, card.healthPath, 3000)
      const latencyMs = Date.now() - startTime

      // Check if status has changed
      const previousStatus = card.status?.isUp
      const statusChanged = previousStatus !== probeResult.isUp

      // Create status event
      await prisma.statusEvent.create({
        data: {
          cardId: card.id,
          isUp: probeResult.isUp,
          http: probeResult.lastHttp,
          latencyMs: probeResult.latencyMs,
          message: probeResult.message,
        }
      })

      // Update or create CardStatus
      await prisma.cardStatus.upsert({
        where: { cardId: card.id },
        update: {
          isUp: probeResult.isUp,
          lastChecked: new Date(),
          lastHttp: probeResult.lastHttp,
          latencyMs: probeResult.latencyMs,
          message: probeResult.message,
        },
        create: {
          cardId: card.id,
          isUp: probeResult.isUp,
          lastChecked: new Date(),
          lastHttp: probeResult.lastHttp,
          latencyMs: probeResult.latencyMs,
          message: probeResult.message,
        },
      })

      return {
        cardId: card.id,
        isUp: probeResult.isUp,
        http: probeResult.lastHttp,
        latencyMs: probeResult.latencyMs,
        message: probeResult.message,
        statusChanged,
      }

    } catch (error) {
      const latencyMs = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Create status event for failure
      await prisma.statusEvent.create({
        data: {
          cardId: card.id,
          isUp: false,
          message: errorMessage,
          latencyMs,
        }
      })

      // Update CardStatus
      await prisma.cardStatus.upsert({
        where: { cardId: card.id },
        update: {
          isUp: false,
          lastChecked: new Date(),
          message: errorMessage,
          latencyMs,
        },
        create: {
          cardId: card.id,
          isUp: false,
          lastChecked: new Date(),
          message: errorMessage,
          latencyMs,
        },
      })

      const previousStatus = card.status?.isUp
      const statusChanged = previousStatus !== false

      return {
        cardId: card.id,
        isUp: false,
        message: errorMessage,
        latencyMs,
        statusChanged,
      }
    }
  }

  /**
   * Heartbeat function - logs status and ensures service is running
   */
  private async heartbeat() {
    try {
      const now = new Date()
      this.lastHeartbeat = now
      
      // Get summary stats
      const totalCards = await prisma.card.count({ where: { isEnabled: true } })
      const upCards = await prisma.cardStatus.count({ where: { isUp: true } })
      const recentEvents = await prisma.statusEvent.count({
        where: {
          timestamp: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })

      console.log(`[${now.toISOString()}] Heartbeat: ${upCards}/${totalCards} cards up, ${recentEvents} events in 24h`)
      
    } catch (error) {
      console.error('Error during heartbeat:', error)
    }
  }

  /**
   * Get the last heartbeat time
   */
  getLastHeartbeat(): Date {
    return this.lastHeartbeat
  }

  /**
   * Check if the sweeper is running
   */
  isActive(): boolean {
    return this.isRunning
  }
}

// Export singleton instance
export const statusSweeper = new StatusSweeper()

