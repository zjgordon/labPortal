import { Logger } from './logger'
import { getConfig } from './config'

interface ActionReport {
  actionId: string
  status: 'running' | 'succeeded' | 'failed'
  exitCode?: number | null
  message?: string
  stderr?: string
}

export class PortalClient {
  private baseUrl: string
  private token: string
  private logger: Logger

  constructor() {
    const config = getConfig()
    this.baseUrl = config.portalBaseUrl
    this.token = config.agentToken
    this.logger = new Logger()
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    }
  }

  async sendHeartbeat(): Promise<void> {
    const url = `${this.baseUrl}/api/agents/heartbeat`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      throw new Error(`Heartbeat failed: ${response.status} ${response.statusText}`)
    }

    this.logger.debug('Heartbeat sent successfully')
  }

  async getQueuedActions(max: number = 1): Promise<any[]> {
    const url = `${this.baseUrl}/api/control/queue?max=${max}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      if (response.status === 404) {
        // No actions available
        return []
      }
      throw new Error(`Failed to get queued actions: ${response.status} ${response.statusText}`)
    }

    const actions = await response.json()
    return Array.isArray(actions) ? actions : []
  }

  async reportActionStatus(
    actionId: string, 
    status: 'running' | 'succeeded' | 'failed',
    exitCode?: number | null,
    message?: string,
    stderr?: string
  ): Promise<void> {
    const url = `${this.baseUrl}/api/control/report`
    
    // Cap message and stderr length to prevent overly long reports
    const cappedMessage = message ? this.capLength(message, 500) : undefined
    const cappedStderr = stderr ? this.capLength(stderr, 1000) : undefined
    
    const report: ActionReport = {
      actionId,
      status,
      ...(exitCode !== undefined && { exitCode }),
      ...(cappedMessage && { message: cappedMessage }),
      ...(cappedStderr && { stderr: cappedStderr }),
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(report),
    })

    if (!response.ok) {
      throw new Error(`Failed to report action status: ${response.status} ${response.statusText}`)
    }

    this.logger.debug(`Action ${actionId} status reported: ${status}`)
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.sendHeartbeat()
      return true
    } catch (error) {
      this.logger.error('Connection test failed:', error)
      return false
    }
  }

  private capLength(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text
    }
    return text.substring(0, maxLength - 3) + '...'
  }
}
