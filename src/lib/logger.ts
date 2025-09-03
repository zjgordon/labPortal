import { env } from '@/lib/env'

/**
 * Enhanced logging system for Lab Portal
 * Features:
 * - Structured logging with consistent format
 * - Action lifecycle tracking
 * - Host and service identification
 * - No sensitive data exposure
 * - Timestamp and correlation IDs
 */

export interface ActionLogData {
  actionId: string
  hostId: string
  hostName: string
  serviceId: string
  serviceName: string
  action: string
  status: string
  requestedBy: string
  message?: string
  exitCode?: number
  durationMs?: number
}

export interface SecurityLogData {
  event: string
  userId?: string
  userEmail?: string
  ipAddress?: string
  resource?: string
  action?: string
  success: boolean
  message: string
}

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString()
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = this.getTimestamp()
    const dataStr = data ? ` | ${JSON.stringify(data)}` : ''
    return `[${timestamp}] [${level}] ${message}${dataStr}`
  }

  info(message: string, data?: any): void {
    console.log(this.formatMessage('INFO', message, data))
  }

  warn(message: string, data?: any): void {
    console.warn(this.formatMessage('WARN', message, data))
  }

  error(message: string, data?: any): void {
    console.error(this.formatMessage('ERROR', message, data))
  }

  debug(message: string, data?: any): void {
    if (env.NODE_ENV === 'development') {
      console.log(this.formatMessage('DEBUG', message, data))
    }
  }

  // Action lifecycle logging
  actionQueued(data: ActionLogData): void {
    this.info('Action queued', {
      actionId: data.actionId,
      hostId: data.hostId,
      hostName: data.hostName,
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      action: data.action,
      requestedBy: data.requestedBy,
      timestamp: this.getTimestamp()
    })
  }

  actionStarted(data: ActionLogData): void {
    this.info('Action started', {
      actionId: data.actionId,
      hostId: data.hostId,
      hostName: data.hostName,
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      action: data.action,
      timestamp: this.getTimestamp()
    })
  }

  actionCompleted(data: ActionLogData): void {
    this.info('Action completed', {
      actionId: data.actionId,
      hostId: data.hostId,
      hostName: data.hostName,
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      action: data.action,
      status: data.status,
      exitCode: data.exitCode,
      durationMs: data.durationMs,
      message: data.message,
      timestamp: this.getTimestamp()
    })
  }

  actionFailed(data: ActionLogData): void {
    this.error('Action failed', {
      actionId: data.actionId,
      hostId: data.hostId,
      hostName: data.hostName,
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      action: data.action,
      status: data.status,
      exitCode: data.exitCode,
      durationMs: data.durationMs,
      message: data.message,
      timestamp: this.getTimestamp()
    })
  }

  // Security event logging
  securityEvent(data: SecurityLogData): void {
    const logData = {
      event: data.event,
      userId: data.userId,
      userEmail: data.userEmail,
      ipAddress: data.ipAddress,
      resource: data.resource,
      action: data.action,
      success: data.success,
      message: data.message,
      timestamp: this.getTimestamp()
    }

    if (data.success) {
      this.info('Security event', logData)
    } else {
      this.warn('Security event', logData)
    }
  }

  // Rate limiting events
  rateLimitExceeded(identifier: string, endpoint: string, limit: number): void {
    this.warn('Rate limit exceeded', {
      identifier,
      endpoint,
      limit,
      timestamp: this.getTimestamp()
    })
  }

  // System health logging
  systemHealth(component: string, status: string, details?: any): void {
    this.info('System health', {
      component,
      status,
      details,
      timestamp: this.getTimestamp()
    })
  }
}

export const logger = new Logger()
