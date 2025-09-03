import { execFile } from 'child_process'
import { promisify } from 'util'
import { Logger } from './logger'
import { getConfig } from './config'

const execFileAsync = promisify(execFile)

interface ExecutionResult {
  success: boolean
  exitCode: number | null
  stdout: string
  stderr: string
  message: string
  duration: number
  isTimeout: boolean
}

export class ActionExecutor {
  private logger: Logger
  private readonly ALLOWED_COMMANDS = ['start', 'stop', 'restart', 'status'] as const
  private readonly ALLOWED_UNIT_PATTERNS = [
    /^[a-zA-Z0-9._@-]+\.service$/,
    /^[a-zA-Z0-9._@-]+\.socket$/,
    /^[a-zA-Z0-9._@-]+\.timer$/,
    /^[a-zA-Z0-9._@-]+\.path$/,
  ]

  constructor() {
    this.logger = new Logger()
  }

  async execute(command: string, unitName: string): Promise<ExecutionResult> {
    const startTime = Date.now()
    const config = getConfig()
    const timeout = config.execTimeoutMs
    const restartRetry = config.restartRetry

    // Validate command
    if (!this.isValidCommand(command)) {
      throw new Error(`Invalid command: ${command}. Allowed: ${this.ALLOWED_COMMANDS.join(', ')}`)
    }

    // Validate unit name
    if (!this.isValidUnitName(unitName)) {
      throw new Error(`Invalid unit name: ${unitName}`)
    }

    this.logger.info(`Executing: systemctl ${command} ${unitName} (timeout: ${timeout}ms)`)

    try {
      // Try user services first, then system services
      let result: ExecutionResult

      try {
        // First try user services
        result = await this.executeUserService(command, unitName, timeout)
      } catch (error) {
        // If user service fails, try system service
        this.logger.debug(`User service failed, trying system service: ${error}`)
        result = await this.executeSystemService(command, unitName, timeout)
      }

      const duration = Date.now() - startTime
      result.duration = duration

      // Handle restart retry logic
      if (command === 'restart' && !result.success && result.exitCode !== null && result.exitCode !== 0 && !result.isTimeout) {
        if (restartRetry > 0) {
          this.logger.info(`Restart failed with exit code ${result.exitCode}, retrying once after delay...`)
          
          // Wait a bit before retry
          await this.sleep(2000)
          
          const retryResult = await this.executeWithRetry(command, unitName, timeout)
          retryResult.duration = Date.now() - startTime
          
          if (retryResult.success) {
            this.logger.info('Restart retry succeeded')
            return retryResult
          } else {
            this.logger.warn('Restart retry also failed')
            return retryResult
          }
        }
      }

      this.logger.info(`Command completed in ${duration}ms with exit code ${result.exitCode}`)
      return result

    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      this.logger.error(`Command failed after ${duration}ms: ${errorMessage}`)
      
      return {
        success: false,
        exitCode: null,
        stdout: '',
        stderr: errorMessage,
        message: `Execution failed: ${errorMessage}`,
        duration,
        isTimeout: false,
      }
    }
  }

  private async executeWithRetry(command: string, unitName: string, timeout: number): Promise<ExecutionResult> {
    try {
      // Try user service first
      return await this.executeUserService(command, unitName, timeout)
    } catch (error) {
      // Fall back to system service
      return await this.executeSystemService(command, unitName, timeout)
    }
  }

  private async executeUserService(command: string, unitName: string, timeout: number): Promise<ExecutionResult> {
    const args = [command, unitName]
    
    try {
      const { stdout, stderr } = await execFileAsync('systemctl', args, {
        timeout,
        maxBuffer: 1024 * 1024, // 1MB buffer
      })

      return {
        success: true,
        exitCode: 0,
        stdout: this.sanitizeOutput(stdout),
        stderr: this.sanitizeOutput(stderr),
        message: this.createMessage(command, unitName, true, stderr),
        duration: 0, // Will be set by caller
        isTimeout: false,
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error('systemctl command not found')
      }
      
      // Check if it's a timeout
      const isTimeout = error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM'
      const exitCode = isTimeout ? null : (error.code || -1)
      
      return {
        success: false,
        exitCode,
        stdout: '',
        stderr: this.sanitizeOutput(error.stderr || ''),
        message: isTimeout ? 
          `Command timed out after ${timeout}ms: systemctl ${command} ${unitName}` :
          this.createMessage(command, unitName, false, error.stderr || ''),
        duration: 0, // Will be set by caller
        isTimeout,
      }
    }
  }

  private async executeSystemService(command: string, unitName: string, timeout: number): Promise<ExecutionResult> {
    const args = [command, unitName]
    
    try {
      const { stdout, stderr } = await execFileAsync('sudo', ['systemctl', ...args], {
        timeout,
        maxBuffer: 1024 * 1024, // 1MB buffer
      })

      return {
        success: true,
        exitCode: 0,
        stdout: this.sanitizeOutput(stdout),
        stderr: this.sanitizeOutput(stderr),
        message: this.createMessage(command, unitName, true, stderr),
        duration: 0, // Will be set by caller
        isTimeout: false,
      }
    } catch (error: any) {
      // Check if it's a timeout
      const isTimeout = error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM'
      const exitCode = isTimeout ? null : (error.code || -1)
      
      return {
        success: false,
        exitCode,
        stdout: '',
        stderr: this.sanitizeOutput(error.stderr || ''),
        message: isTimeout ? 
          `Command timed out after ${timeout}ms: systemctl ${command} ${unitName}` :
          this.createMessage(command, unitName, false, error.stderr || ''),
        duration: 0, // Will be set by caller
        isTimeout,
      }
    }
  }

  private isValidCommand(command: string): command is typeof this.ALLOWED_COMMANDS[number] {
    return this.ALLOWED_COMMANDS.includes(command as any)
  }

  private isValidUnitName(unitName: string): boolean {
    return this.ALLOWED_UNIT_PATTERNS.some(pattern => pattern.test(unitName))
  }

  private sanitizeOutput(output: string): string {
    if (!output) return ''
    
    // Remove potentially sensitive information
    return output
      .replace(/password\s*[:=]\s*\S+/gi, 'password: [REDACTED]')
      .replace(/token\s*[:=]\s*\S+/gi, 'token: [REDACTED]')
      .replace(/key\s*[:=]\s*\S+/gi, 'key: [REDACTED]')
      .trim()
  }

  private createMessage(command: string, unitName: string, success: boolean, stderr: string): string {
    if (success) {
      return `Successfully executed: systemctl ${command} ${unitName}`
    } else {
      return `Failed to execute: systemctl ${command} ${unitName}. Error: ${stderr || 'Unknown error'}`
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
