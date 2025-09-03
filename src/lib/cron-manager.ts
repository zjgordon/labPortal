/**
 * Cron job manager for Lab Portal
 * Features:
 * - Automatic action pruning every 24 hours
 * - Configurable schedules
 * - Error handling and logging
 * - Graceful shutdown
 */

import { actionPruner } from './action-pruner'
import { logger } from './logger'
import { validateEnv } from './env'

interface CronJob {
  id: string
  name: string
  schedule: string
  handler: () => Promise<void>
  lastRun?: Date
  nextRun?: Date
  isRunning: boolean
}

class CronManager {
  private jobs: Map<string, CronJob> = new Map()
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private isShutdown = false

  constructor() {
    // Validate environment variables on startup
    if (!validateEnv()) {
      logger.error('Environment validation failed. Application cannot start.')
      process.exit(1)
    }
    
    this.setupDefaultJobs()
    this.setupGracefulShutdown()
  }

  private setupDefaultJobs(): void {
    // Daily action pruning at 2 AM
    this.addJob({
      id: 'action-pruning',
      name: 'Action Pruning',
      schedule: '0 2 * * *', // 2 AM daily
      isRunning: false,
      handler: async () => {
        try {
          logger.info('Starting scheduled action pruning')
          const result = await actionPruner.pruneOldActions()
          logger.info('Scheduled action pruning completed', {
            totalActions: result.totalActions,
            actionsDeleted: result.actionsDeleted,
            errors: result.errors.length
          })
        } catch (error) {
          logger.error('Scheduled action pruning failed', {
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }
    })
  }

  private setupGracefulShutdown(): void {
    process.on('SIGTERM', () => this.shutdown())
    process.on('SIGINT', () => this.shutdown())
  }

  /**
   * Add a new cron job
   */
  addJob(job: CronJob): void {
    if (this.jobs.has(job.id)) {
      logger.warn('Cron job already exists', { jobId: job.id })
      return
    }

    this.jobs.set(job.id, job)
    this.scheduleJob(job)
    
    logger.info('Cron job added', {
      jobId: job.id,
      name: job.name,
      schedule: job.schedule
    })
  }

  /**
   * Remove a cron job
   */
  removeJob(jobId: string): boolean {
    const job = this.jobs.get(jobId)
    if (!job) return false

    // Clear the interval
    const interval = this.intervals.get(jobId)
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(jobId)
    }

    this.jobs.delete(jobId)
    
    logger.info('Cron job removed', { jobId })
    return true
  }

  /**
   * Schedule a job based on its schedule
   */
  private scheduleJob(job: CronJob): void {
    // For now, use a simple interval-based approach
    // In production, you might want to use a proper cron parser
    const intervalMs = this.parseSchedule(job.schedule)
    
    if (intervalMs > 0) {
      const interval = setInterval(async () => {
        if (this.isShutdown || job.isRunning) return
        
        try {
          job.isRunning = true
          job.lastRun = new Date()
          
          await job.handler()
          
          job.nextRun = new Date(Date.now() + intervalMs)
          
        } catch (error) {
          logger.error('Cron job execution failed', {
            jobId: job.id,
            error: error instanceof Error ? error.message : String(error)
          })
        } finally {
          job.isRunning = false
        }
      }, intervalMs)

      this.intervals.set(job.id, interval)
      
      // Set initial next run time
      job.nextRun = new Date(Date.now() + intervalMs)
    }
  }

  /**
   * Parse cron schedule to milliseconds
   * Simple implementation - in production use a proper cron parser
   */
  private parseSchedule(schedule: string): number {
    // For now, handle common patterns
    if (schedule === '0 2 * * *') { // 2 AM daily
      return 24 * 60 * 60 * 1000
    }
    if (schedule === '0 */6 * * *') { // Every 6 hours
      return 6 * 60 * 60 * 1000
    }
    if (schedule === '0 */1 * * *') { // Every hour
      return 60 * 60 * 1000
    }
    
    // Default to daily
    return 24 * 60 * 60 * 1000
  }

  /**
   * Get all jobs status
   */
  getJobsStatus(): Array<{
    id: string
    name: string
    schedule: string
    lastRun: Date | undefined
    nextRun: Date | undefined
    isRunning: boolean
  }> {
    return Array.from(this.jobs.values()).map(job => ({
      id: job.id,
      name: job.name,
      schedule: job.schedule,
      lastRun: job.lastRun,
      nextRun: job.nextRun,
      isRunning: job.isRunning
    }))
  }

  /**
   * Manually trigger a job
   */
  async triggerJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId)
    if (!job || job.isRunning) return false

    try {
      job.isRunning = true
      job.lastRun = new Date()
      
      await job.handler()
      
      logger.info('Manual job trigger completed', { jobId })
      return true
      
    } catch (error) {
      logger.error('Manual job trigger failed', {
        jobId,
        error: error instanceof Error ? error.message : String(error)
      })
      return false
      
    } finally {
      job.isRunning = false
    }
  }

  /**
   * Graceful shutdown
   */
  private shutdown(): void {
    if (this.isShutdown) return
    
    logger.info('Shutting down cron manager')
    this.isShutdown = true

    // Clear all intervals
    this.intervals.forEach((interval, jobId) => {
      clearInterval(interval)
      logger.info('Cleared interval for job', { jobId })
    })

    this.intervals.clear()
    logger.info('Cron manager shutdown complete')
  }

  /**
   * Check if manager is shutting down
   */
  isShuttingDown(): boolean {
    return this.isShutdown
  }
}

// Create and export the cron manager instance
export const cronManager = new CronManager()
