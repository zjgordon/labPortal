import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { actionPruner } from '@/lib/action-pruner'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdminAuth(request)
    if (authError) return authError

    // Get pruning statistics
    const stats = await actionPruner.getPruningStats()
    
    return NextResponse.json({
      message: 'Action pruning statistics',
      stats
    })
  } catch (error) {
    console.error('Failed to get pruning stats:', error)
    return NextResponse.json(
      { error: 'Failed to get pruning statistics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdminAuth(request)
    if (authError) return authError

    const body = await request.json()
    const { retentionDays, batchSize, dryRun = false } = body

    // Validate input
    if (retentionDays && (typeof retentionDays !== 'number' || retentionDays < 1 || retentionDays > 365)) {
      return NextResponse.json(
        { error: 'retentionDays must be a number between 1 and 365' },
        { status: 400 }
      )
    }

    if (batchSize && (typeof batchSize !== 'number' || batchSize < 1 || batchSize > 10000)) {
      return NextResponse.json(
        { error: 'batchSize must be a number between 1 and 10000' },
        { status: 400 }
      )
    }

    // Update configuration if provided
    if (retentionDays || batchSize !== undefined) {
      actionPruner.setConfig({
        retentionDays: retentionDays || 90,
        batchSize: batchSize || 1000,
        dryRun
      })
    }

    // Execute pruning
    const result = await actionPruner.pruneOldActions()

    // Log the pruning operation
    logger.info('Manual action pruning executed', {
      retentionDays: retentionDays || 90,
      batchSize: batchSize || 1000,
      dryRun,
      totalActions: result.totalActions,
      actionsToDelete: result.actionsToDelete,
      actionsDeleted: result.actionsDeleted,
      errors: result.errors.length
    })

    return NextResponse.json({
      message: 'Action pruning completed',
      result
    })
  } catch (error) {
    console.error('Failed to execute action pruning:', error)
    
    logger.error('Action pruning failed', {
      error: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json(
      { error: 'Failed to execute action pruning' },
      { status: 500 }
    )
  }
}
