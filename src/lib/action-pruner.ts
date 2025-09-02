/**
 * Action data management and pruning system
 * Features:
 * - Automatic pruning of old actions (>90 days)
 * - Configurable retention periods
 * - Immutable action history
 * - Batch processing for performance
 * - Audit trail preservation
 */

import { prisma } from './prisma'
import { logger } from './logger'

export interface PruningConfig {
  retentionDays: number
  batchSize: number
  dryRun: boolean
}

export interface PruningResult {
  totalActions: number
  actionsToDelete: number
  actionsDeleted: number
  errors: string[]
  dryRun: boolean
}

export class ActionPruner {
  private config: PruningConfig

  constructor(config: PruningConfig = {
    retentionDays: 90,
    batchSize: 1000,
    dryRun: false
  }) {
    this.config = config
  }

  /**
   * Prune old actions based on retention policy
   */
  async pruneOldActions(): Promise<PruningResult> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays)

    try {
      // Count total actions
      const totalActions = await prisma.action.count()
      
      // Count actions to be deleted
      const actionsToDelete = await prisma.action.count({
        where: {
          requestedAt: {
            lt: cutoffDate
          }
        }
      })

      if (actionsToDelete === 0) {
        logger.info('No actions to prune', {
          retentionDays: this.config.retentionDays,
          cutoffDate: cutoffDate.toISOString()
        })
        return {
          totalActions,
          actionsToDelete: 0,
          actionsDeleted: 0,
          errors: [],
          dryRun: this.config.dryRun
        }
      }

      logger.info('Starting action pruning', {
        retentionDays: this.config.retentionDays,
        cutoffDate: cutoffDate.toISOString(),
        actionsToDelete,
        dryRun: this.config.dryRun
      })

      if (this.config.dryRun) {
        logger.info('Dry run mode - no actions will be deleted', {
          actionsToDelete,
          cutoffDate: cutoffDate.toISOString()
        })
        return {
          totalActions,
          actionsToDelete,
          actionsDeleted: 0,
          errors: [],
          dryRun: true
        }
      }

      // Delete old actions in batches
      let actionsDeleted = 0
      const errors: string[] = []
      let offset = 0

      while (offset < actionsToDelete) {
        try {
          const batch = await prisma.action.findMany({
            where: {
              requestedAt: {
                lt: cutoffDate
              }
            },
            select: {
              id: true,
              requestedAt: true,
              hostId: true,
              serviceId: true,
              kind: true,
              status: true
            },
            take: this.config.batchSize,
            skip: offset,
            orderBy: {
              requestedAt: 'asc'
            }
          })

          if (batch.length === 0) break

          // Log batch before deletion for audit purposes
          logger.info('Pruning action batch', {
            batchSize: batch.length,
            offset,
            oldestAction: batch[0]?.requestedAt,
            newestAction: batch[batch.length - 1]?.requestedAt
          })

          // Delete the batch
          const deleteResult = await prisma.action.deleteMany({
            where: {
              id: {
                in: batch.map(a => a.id)
              }
            }
          })

          actionsDeleted += deleteResult.count
          offset += this.config.batchSize

          logger.info('Batch pruning completed', {
            batchSize: batch.length,
            deleted: deleteResult.count,
            totalDeleted: actionsDeleted,
            remaining: actionsToDelete - actionsDeleted
          })

        } catch (error) {
          const errorMsg = `Failed to prune batch at offset ${offset}: ${error instanceof Error ? error.message : String(error)}`
          errors.push(errorMsg)
          logger.error('Batch pruning failed', {
            offset,
            error: errorMsg
          })
          break
        }
      }

      logger.info('Action pruning completed', {
        totalActions,
        actionsToDelete,
        actionsDeleted,
        errors: errors.length,
        dryRun: this.config.dryRun
      })

      return {
        totalActions,
        actionsToDelete,
        actionsDeleted,
        errors,
        dryRun: this.config.dryRun
      }

    } catch (error) {
      const errorMsg = `Action pruning failed: ${error instanceof Error ? error.message : String(error)}`
      logger.error('Action pruning failed', {
        error: errorMsg,
        retentionDays: this.config.retentionDays
      })
      throw new Error(errorMsg)
    }
  }

  /**
   * Get pruning statistics
   */
  async getPruningStats(): Promise<{
    totalActions: number
    actionsOlderThan90Days: number
    actionsOlderThan30Days: number
    actionsOlderThan7Days: number
    oldestAction: Date | null
    newestAction: Date | null
  }> {
    const [totalActions, actions90Days, actions30Days, actions7Days, oldest, newest] = await Promise.all([
      prisma.action.count(),
      prisma.action.count({
        where: {
          requestedAt: {
            lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.action.count({
        where: {
          requestedAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.action.count({
        where: {
          requestedAt: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.action.findFirst({
        orderBy: { requestedAt: 'asc' },
        select: { requestedAt: true }
      }),
      prisma.action.findFirst({
        orderBy: { requestedAt: 'desc' },
        select: { requestedAt: true }
      })
    ])

    return {
      totalActions,
      actionsOlderThan90Days: actions90Days,
      actionsOlderThan30Days: actions30Days,
      actionsOlderThan7Days: actions7Days,
      oldestAction: oldest?.requestedAt || null,
      newestAction: newest?.requestedAt || null
    }
  }

  /**
   * Set pruning configuration
   */
  setConfig(config: Partial<PruningConfig>): void {
    this.config = { ...this.config, ...config }
    logger.info('Action pruner configuration updated', this.config)
  }
}

// Create default instance
export const actionPruner = new ActionPruner()
