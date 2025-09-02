import { Logger } from './logger'

interface ActionReport {
  actionId: string
  status: 'running' | 'succeeded' | 'failed'
  exitCode?: number
  message?: string
}

export class PortalClient {
  private baseUrl: string
  private token: string
  private logger: Logger

  constructor() {
    this.baseUrl = process.env.PORTAL_BASE_URL!
    this.token = process.env.AGENT_TOKEN!
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
    exitCode?: number,
    message?: string
  ): Promise<void> {
    const url = `${this.baseUrl}/api/control/report`
    const report: ActionReport = {
      actionId,
      status,
      ...(exitCode !== undefined && { exitCode }),
      ...(message && { message }),
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
}
