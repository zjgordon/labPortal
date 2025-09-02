import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { cronManager } from '@/lib/cron-manager'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdminAuth(request)
    if (authError) return authError

    // Get cron jobs status
    const jobsStatus = cronManager.getJobsStatus()
    
    return NextResponse.json({
      message: 'Cron jobs status',
      jobs: jobsStatus
    })
  } catch (error) {
    console.error('Failed to get cron jobs status:', error)
    return NextResponse.json(
      { error: 'Failed to get cron jobs status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdminAuth(request)
    if (authError) return authError

    const body = await request.json()
    const { action, jobId } = body

    if (!action || !jobId) {
      return NextResponse.json(
        { error: 'action and jobId are required' },
        { status: 400 }
      )
    }

    let result: boolean | string

    switch (action) {
      case 'trigger':
        result = await cronManager.triggerJob(jobId)
        if (result) {
          logger.info('Manual cron job trigger', { jobId, action })
        } else {
          logger.warn('Manual cron job trigger failed', { jobId, action })
        }
        break
        
      case 'remove':
        result = cronManager.removeJob(jobId)
        if (result) {
          logger.info('Cron job removed', { jobId, action })
        } else {
          logger.warn('Failed to remove cron job', { jobId, action })
        }
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "trigger" or "remove"' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      message: `Cron job ${action} completed`,
      jobId,
      action,
      result
    })
  } catch (error) {
    console.error('Failed to manage cron job:', error)
    
    logger.error('Cron job management failed', {
      error: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json(
      { error: 'Failed to manage cron job' },
      { status: 500 }
    )
  }
}
