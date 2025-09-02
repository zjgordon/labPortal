import { exec } from 'child_process'

/**
 * Safe systemctl command executor
 * Only runs on the server-side and validates all inputs
 */
export class SystemctlExecutor {
  private static readonly ALLOWED_COMMANDS = ['start', 'stop', 'restart', 'status'] as const
  private static readonly ALLOWED_UNIT_PATTERNS = [
    /^[a-zA-Z0-9._@-]+\.service$/,  // Standard service units
    /^[a-zA-Z0-9._@-]+\.socket$/,   // Socket units
    /^[a-zA-Z0-9._@-]+\.timer$/,    // Timer units
    /^[a-zA-Z0-9._@-]+\.target$/,   // Target units
  ]

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
  }> {
    return new Promise((resolve) => {
      // Validate command
      if (!this.ALLOWED_COMMANDS.includes(command)) {
        resolve({
          success: false,
          exitCode: -1,
          stdout: '',
          stderr: '',
          message: `Invalid command: ${command}. Allowed commands: ${this.ALLOWED_COMMANDS.join(', ')}`
        })
        return
      }

      // Validate unit name
      if (!this.isValidUnitName(unitName)) {
        resolve({
          success: false,
          exitCode: -1,
          stdout: '',
          stderr: '',
          message: `Invalid unit name: ${unitName}. Must match allowed patterns.`
        })
        return
      }

      // Build the command
      let cmd: string
      if (allowSystemctl) {
        // Use sudo systemctl for system-wide services
        cmd = `sudo systemctl ${command} ${unitName}`
      } else {
        // Use user systemctl for user services
        cmd = `systemctl --user ${command} ${unitName}`
      }

      // Execute the command
      exec(cmd, {
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024 // 1MB buffer
      }, (error, stdout, stderr) => {
        if (error) {
          // Command failed
          resolve({
            success: false,
            exitCode: error.code || -1,
            stdout: stdout || '',
            stderr: stderr || '',
            message: `Failed to execute systemctl command: ${error.message}`
          })
        } else {
          // Command succeeded
          const sanitizedStdout = this.sanitizeOutput(stdout || '')
          const sanitizedStderr = this.sanitizeOutput(stderr || '')
          
          // Create user-friendly message
          const message = this.createMessage(command, unitName, true, sanitizedStderr)

          resolve({
            success: true,
            exitCode: 0,
            stdout: sanitizedStdout,
            stderr: sanitizedStderr,
            message
          })
        }
      })
    })
  }

  /**
   * Validate unit name against allowed patterns
   */
  private static isValidUnitName(unitName: string): boolean {
    return this.ALLOWED_UNIT_PATTERNS.some(pattern => pattern.test(unitName))
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
   * Create user-friendly message based on command result
   */
  private static createMessage(
    command: string,
    unitName: string,
    success: boolean,
    stderr: string
  ): string {
    if (success) {
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
    } else {
      if (stderr.includes('Unit not found')) {
        return `Unit ${unitName} not found`
      } else if (stderr.includes('Permission denied')) {
        return `Permission denied to ${command} ${unitName}`
      } else if (stderr.includes('Failed to start')) {
        return `Failed to start ${unitName}: ${stderr}`
      } else if (stderr.includes('Failed to stop')) {
        return `Failed to stop ${unitName}: ${stderr}`
      } else if (stderr.includes('Failed to restart')) {
        return `Failed to restart ${unitName}: ${stderr}`
      } else {
        return `Failed to ${command} ${unitName}: ${stderr || 'Unknown error'}`
      }
    }
  }

  /**
   * Check if a unit is a system service (requires sudo)
   */
  static isSystemService(unitName: string): boolean {
    // Common system services that typically require sudo
    const systemServices = [
      'nginx.service',
      'apache2.service',
      'postgresql.service',
      'mysql.service',
      'docker.service',
      'ssh.service',
      'systemd-networkd.service',
      'systemd-resolved.service'
    ]
    
    return systemServices.includes(unitName)
  }
}
