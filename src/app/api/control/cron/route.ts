import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { cronManager } from '@/lib/cron-manager'
import { logger } from '@/lib/logger'
import { verifyOrigin, createCsrfErrorResponse } from '@/lib/auth/csrf-protection'
import { env } from '@/lib/env'

export async function POST(request: NextRequest) {
  try {
    // Admin session authentication
    const authError = await requireAdminAuth(request)
    if (authError) return authError
    
    // Server-side secret validation
    if (!env.ADMIN_CRON_SECRET) {
      return NextResponse.json(
        { error: 'Cron management not configured' },
        { status: 503 }
      )
    }
    
    const cronSecret = request.headers.get('x-cron-secret')
    if (!cronSecret || cronSecret !== env.ADMIN_CRON_SECRET) {
      return NextResponse.json(
        { error: 'Invalid or missing cron secret' },
        { status: 403 }
      )
    }
    
    // CSRF protection for state-changing methods
    if (!verifyOrigin(request)) {
      return createCsrfErrorResponse(request)
    }

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
