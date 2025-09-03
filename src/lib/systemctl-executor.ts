import { exec } from 'child_process'
import { LOCAL_ACTION_CONFIG } from './env'

/**
 * Safe systemctl command executor
 * Only runs on the server-side and validates all inputs
 */
export class SystemctlExecutor {
  private static readonly ALLOWED_COMMANDS = ['start', 'stop', 'restart', 'status'] as const

  /**
   * Execute a systemctl command safely
   */
  static async execute(
    command: typeof SystemctlExecutor.ALLOWED_COMMANDS[number],
    unitName: string,
    allowSystemctl: boolean = false
  ): Promise<{
    success: boolean
    exitCode: number
    stdout: string
    stderr: string
    message: string
    durationMs: number
    isTimeout: boolean
  }> {
    const startTime = Date.now()
    
    return new Promise((resolve) => {
      // Validate command
      if (!this.ALLOWED_COMMANDS.includes(command)) {
        const durationMs = Date.now() - startTime
        resolve({
          success: false,
          exitCode: -1,
          stdout: '',
          stderr: '',
          message: `Invalid command: ${command}. Allowed commands: ${this.ALLOWED_COMMANDS.join(', ')}`,
          durationMs,
          isTimeout: false
        })
        return
      }

      // Validate unit name against regex allowlist
      if (!this.isValidUnitName(unitName)) {
        const durationMs = Date.now() - startTime
        resolve({
          success: false,
          exitCode: -1,
          stdout: '',
          stderr: '',
          message: `Invalid unit name: ${unitName}. Must match allowlist regex: ${LOCAL_ACTION_CONFIG.UNIT_ALLOWLIST_REGEX}`,
          durationMs,
          isTimeout: false
        })
        return
      }

      // Build the command - user services first, then system services
      let cmd: string
      let args: string[]
      
      if (allowSystemctl) {
        // Use sudo systemctl for system-wide services
        args = ['systemctl', command, unitName]
        cmd = `sudo systemctl ${command} ${unitName}`
      } else {
        // Use user systemctl for user services
        args = ['systemctl', '--user', command, unitName]
        cmd = `systemctl --user ${command} ${unitName}`
      }

      // Execute the command with configurable timeout
      exec(cmd, {
        timeout: LOCAL_ACTION_CONFIG.EXEC_TIMEOUT_MS,
        maxBuffer: 1024 * 1024 // 1MB buffer
      }, (error, stdout, stderr) => {
        const durationMs = Date.now() - startTime
        
        if (error) {
          // Check if it's a timeout - use type assertion to handle string/number types
          // @ts-ignore - error.code can be string or number from exec callback
          const isTimeout = (error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM')
          
          // Determine exit code and message
          let exitCode: number
          if (typeof error.code === 'number') {
            exitCode = error.code
          } else if (error.code === 'ETIMEDOUT') {
            exitCode = -2 // Special exit code for timeout
          } else {
            exitCode = -1
          }
          let message: string
          
          if (isTimeout) {
            exitCode = -2 // Special exit code for timeout
            message = `Command timed out after ${LOCAL_ACTION_CONFIG.EXEC_TIMEOUT_MS}ms: systemctl ${command} ${unitName}`
          } else {
            // Non-zero exit code (not timeout)
            message = this.createErrorMessage(command, unitName, stderr, exitCode)
          }
          
          resolve({
            success: false,
            exitCode,
            stdout: stdout || '',
            stderr: stderr || '',
            message,
            durationMs,
            isTimeout
          })
        } else {
          // Command succeeded
          const sanitizedStdout = this.sanitizeOutput(stdout || '')
          const sanitizedStderr = this.sanitizeOutput(stderr || '')
          
          // Create success message
          const message = this.createSuccessMessage(command, unitName)

          resolve({
            success: true,
            exitCode: 0,
            stdout: sanitizedStdout,
            stderr: sanitizedStderr,
            message,
            durationMs,
            isTimeout: false
          })
        }
      })
    })
  }

  /**
   * Validate unit name against allowlist regex
   */
  private static isValidUnitName(unitName: string): boolean {
    try {
      const regex = new RegExp(LOCAL_ACTION_CONFIG.UNIT_ALLOWLIST_REGEX)
      return regex.test(unitName)
    } catch (error) {
      // If regex is invalid, fall back to basic validation
      console.warn('Invalid UNIT_ALLOWLIST_REGEX, falling back to basic validation:', error)
      return /^[a-zA-Z0-9._@-]+\.(service|socket|timer|target)$/.test(unitName)
    }
  }

  /**
   * Sanitize command output to prevent injection attacks
   */
  private static sanitizeOutput(output: string): string {
    return output
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/[&]/g, '&amp;') // Escape ampersands
      .slice(0, 1000) // Limit output length
      .trim()
  }

  /**
   * Create success message based on command
   */
  private static createSuccessMessage(
    command: string,
    unitName: string
  ): string {
    switch (command) {
      case 'start':
        return `Successfully started ${unitName}`
      case 'stop':
        return `Successfully stopped ${unitName}`
      case 'restart':
        return `Successfully restarted ${unitName}`
      case 'status':
        return `Status retrieved for ${unitName}`
      default:
        return `Successfully executed ${command} on ${unitName}`
    }
  }

  /**
   * Create error message based on command failure
   */
  private static createErrorMessage(
    command: string,
    unitName: string,
    stderr: string,
    exitCode: number
  ): string {
    const sanitizedStderr = this.sanitizeOutput(stderr)
    
    if (sanitizedStderr) {
      return `Failed to ${command} ${unitName} (exit code: ${exitCode}): ${sanitizedStderr}`
    } else {
      return `Failed to ${command} ${unitName} (exit code: ${exitCode})`
    }
  }
}
