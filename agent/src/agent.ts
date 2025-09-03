import { ActionExecutor } from './action-executor'
import { PortalClient } from './portal-client'
import { Logger } from './logger'
import { getConfig } from './config'

export class Agent {
  private portalClient: PortalClient
  private actionExecutor: ActionExecutor
  private logger: Logger
  private isRunning: boolean = false
  private pollInterval: number

  constructor() {
    const config = getConfig()
    this.portalClient = new PortalClient()
    this.actionExecutor = new ActionExecutor()
    this.logger = new Logger()
    this.pollInterval = config.pollInterval
  }

  async start(): Promise<void> {
    this.isRunning = true
    this.logger.info('Agent started, beginning main loop...')

    while (this.isRunning) {
      try {
        await this.mainLoop()
        await this.sleep(this.pollInterval)
      } catch (error) {
        this.logger.error('Error in main loop:', error)
        // Wait a bit longer on error before retrying
        await this.sleep(this.pollInterval * 2)
      }
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false
    this.logger.info('Agent stopping...')
  }

  private async mainLoop(): Promise<void> {
    try {
      // 1. Send heartbeat
      await this.sendHeartbeat()
      
      // 2. Check for queued actions
      const action = await this.checkForActions()
      
      if (action) {
        // 3. Execute the action
        await this.executeAction(action)
      }
    } catch (error) {
      this.logger.error('Error in main loop iteration:', error)
    }
  }

  private async sendHeartbeat(): Promise<void> {
    try {
      await this.portalClient.sendHeartbeat()
      this.logger.debug('Heartbeat sent successfully')
    } catch (error) {
      this.logger.error('Failed to send heartbeat:', error)
    }
  }

  private async checkForActions(): Promise<any | null> {
    try {
      const actions = await this.portalClient.getQueuedActions(1)
      if (actions && actions.length > 0) {
        this.logger.info(`Found ${actions.length} queued action(s)`)
        return actions[0]
      }
      return null
    } catch (error) {
      this.logger.error('Failed to check for actions:', error)
      return null
    }
  }

  private async executeAction(action: any): Promise<void> {
    const { id, kind, service } = action
    const unitName = service.unitName

    this.logger.info(`Executing action ${id}: ${kind} ${unitName}`)

    try {
      // Report that we're starting work
      await this.portalClient.reportActionStatus(id, 'running')

      // Execute the systemctl command
      const result = await this.actionExecutor.execute(kind, unitName)

      // Report the final result with enhanced information
      const status = result.success ? 'succeeded' : 'failed'
      
      if (result.isTimeout) {
        // Handle timeout case specifically
        await this.portalClient.reportActionStatus(
          id, 
          'failed', 
          null, // exitCode is null for timeout
          'timeout',
          result.stderr
        )
        this.logger.warn(`Action ${id} timed out`)
      } else {
        // Report normal completion/failure
        await this.portalClient.reportActionStatus(
          id, 
          status, 
          result.exitCode, 
          result.message,
          result.stderr
        )
        this.logger.info(`Action ${id} completed with status: ${status}`)
      }

    } catch (error) {
      this.logger.error(`Failed to execute action ${id}:`, error)
      
      // Report failure
      await this.portalClient.reportActionStatus(
        id, 
        'failed', 
        null, // exitCode is null for execution errors
        `Execution error: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
