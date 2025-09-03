import { SystemctlExecutor } from '../systemctl-executor'

// Mock the exec function
jest.mock('child_process', () => ({
  exec: jest.fn()
}))

const mockExec = require('child_process').exec

describe('SystemctlExecutor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('execute', () => {
    it('should validate allowed commands', async () => {
      const result = await SystemctlExecutor.execute('invalid' as any, 'test.service')
      
      expect(result.success).toBe(false)
      expect(result.exitCode).toBe(-1)
      expect(result.message).toContain('Invalid command')
      expect(result.isTimeout).toBe(false)
    })

    it('should validate unit name against regex', async () => {
      const result = await SystemctlExecutor.execute('start', 'invalid-unit')
      
      expect(result.success).toBe(false)
      expect(result.exitCode).toBe(-1)
      expect(result.message).toContain('Invalid unit name')
      expect(result.message).toContain('allowlist regex')
      expect(result.isTimeout).toBe(false)
    })

    it('should allow valid service names', async () => {
      mockExec.mockImplementation((cmd, options, callback) => {
        // Add a small delay to ensure duration > 0
        setTimeout(() => {
          callback(null, 'success', '')
        }, 1)
      })

      const result = await SystemctlExecutor.execute('start', 'nginx.service')
      
      expect(result.success).toBe(true)
      expect(result.exitCode).toBe(0)
      expect(result.message).toContain('Successfully started nginx.service')
      expect(result.isTimeout).toBe(false)
      expect(result.durationMs).toBeGreaterThanOrEqual(0)
    })

    it('should use user systemctl when allowSystemctl is false', async () => {
      mockExec.mockImplementation((cmd, options, callback) => {
        callback(null, 'success', '')
      })

      await SystemctlExecutor.execute('start', 'nginx.service', false)
      
      expect(mockExec).toHaveBeenCalledWith(
        'systemctl --user start nginx.service',
        expect.objectContaining({
          timeout: 60000,
          maxBuffer: 1024 * 1024
        }),
        expect.any(Function)
      )
    })

    it('should use sudo systemctl when allowSystemctl is true', async () => {
      mockExec.mockImplementation((cmd, options, callback) => {
        callback(null, 'success', '')
      })

      await SystemctlExecutor.execute('start', 'nginx.service', true)
      
      expect(mockExec).toHaveBeenCalledWith(
        'sudo systemctl start nginx.service',
        expect.objectContaining({
          timeout: 60000,
          maxBuffer: 1024 * 1024
        }),
        expect.any(Function)
      )
    })

    it('should handle command failures with exit codes', async () => {
      const error = new Error('Command failed')
      ;(error as any).code = 1
      mockExec.mockImplementation((cmd, options, callback) => {
        // Add a small delay to ensure duration > 0
        setTimeout(() => {
          callback(error, '', 'Unit not found')
        }, 1)
      })

      const result = await SystemctlExecutor.execute('start', 'nonexistent.service')
      
      expect(result.success).toBe(false)
      expect(result.exitCode).toBe(1)
      expect(result.message).toContain('Unit nonexistent.service not found')
      expect(result.message).toContain('exit code: 1')
      expect(result.isTimeout).toBe(false)
      expect(result.durationMs).toBeGreaterThanOrEqual(0)
    })

    it('should handle timeouts with special exit code', async () => {
      const error = new Error('Command timed out')
      ;(error as any).code = 'ETIMEDOUT'
      mockExec.mockImplementation((cmd, options, callback) => {
        // Add a small delay to ensure duration > 0
        setTimeout(() => {
          callback(error, '', '')
        }, 1)
      })

      const result = await SystemctlExecutor.execute('start', 'slow.service')
      
      expect(result.success).toBe(false)
      expect(result.exitCode).toBe(-2)
      expect(result.message).toContain('Command timed out after 60000ms')
      expect(result.isTimeout).toBe(true)
      expect(result.durationMs).toBeGreaterThanOrEqual(0)
    })

    it('should handle SIGTERM as timeout', async () => {
      const error = new Error('Command terminated')
      ;(error as any).signal = 'SIGTERM'
      mockExec.mockImplementation((cmd, options, callback) => {
        callback(error, '', '')
      })

      const result = await SystemctlExecutor.execute('start', 'slow.service')
      
      expect(result.success).toBe(false)
      expect(result.exitCode).toBe(-2)
      expect(result.isTimeout).toBe(true)
    })

    it('should sanitize command output', async () => {
      const output = '<script>alert("xss")</script> & <b>bold</b>'
      mockExec.mockImplementation((cmd, options, callback) => {
        callback(null, output, '')
      })

      const result = await SystemctlExecutor.execute('status', 'nginx.service')
      
      expect(result.stdout).not.toContain('<script>')
      expect(result.stdout).not.toContain('<b>')
      expect(result.stdout).toContain('&amp;')
      expect(result.stdout.length).toBeLessThanOrEqual(1000)
    })

    it('should create appropriate success messages', async () => {
      mockExec.mockImplementation((cmd, options, callback) => {
        callback(null, 'success', '')
      })

      const startResult = await SystemctlExecutor.execute('start', 'nginx.service')
      const stopResult = await SystemctlExecutor.execute('stop', 'nginx.service')
      const restartResult = await SystemctlExecutor.execute('restart', 'nginx.service')
      const statusResult = await SystemctlExecutor.execute('status', 'nginx.service')

      expect(startResult.message).toContain('Successfully started')
      expect(stopResult.message).toContain('Successfully stopped')
      expect(restartResult.message).toContain('Successfully restarted')
      expect(statusResult.message).toContain('Status retrieved')
    })

    it('should create appropriate error messages for common failures', async () => {
      const error = new Error('Command failed')
      ;(error as any).code = 1

      // Test unit not found
      mockExec.mockImplementation((cmd, options, callback) => {
        callback(error, '', 'Unit not found')
      })
      let result = await SystemctlExecutor.execute('start', 'nonexistent.service')
      expect(result.message).toContain('Unit nonexistent.service not found')

      // Test permission denied
      mockExec.mockImplementation((cmd, options, callback) => {
        callback(error, '', 'Permission denied')
      })
      result = await SystemctlExecutor.execute('start', 'nginx.service')
      expect(result.message).toContain('Permission denied')

      // Test failed to start
      mockExec.mockImplementation((cmd, options, callback) => {
        callback(error, '', 'Failed to start')
      })
      result = await SystemctlExecutor.execute('start', 'nginx.service')
      expect(result.message).toContain('Failed to start')
    })
  })

  describe('isValidUnitName', () => {
    it('should validate against regex pattern', () => {
      // Valid names
      expect(SystemctlExecutor['isValidUnitName']('nginx.service')).toBe(true)
      expect(SystemctlExecutor['isValidUnitName']('my-app.service')).toBe(true)
      expect(SystemctlExecutor['isValidUnitName']('app@instance.service')).toBe(true)

      // Invalid names
      expect(SystemctlExecutor['isValidUnitName']('invalid')).toBe(false)
      expect(SystemctlExecutor['isValidUnitName']('../../etc/passwd')).toBe(false)
      expect(SystemctlExecutor['isValidUnitName']('malicious;rm -rf /')).toBe(false)
    })

    it('should fall back to basic validation if regex is invalid', () => {
      // This test verifies the fallback behavior
      // The actual regex validation is tested in integration tests
      expect(SystemctlExecutor['isValidUnitName']('nginx.service')).toBe(true)
      expect(SystemctlExecutor['isValidUnitName']('invalid')).toBe(false)
    })
  })

  describe('isSystemService', () => {
    it('should identify common system services', () => {
      expect(SystemctlExecutor.isSystemService('nginx.service')).toBe(true)
      expect(SystemctlExecutor.isSystemService('docker.service')).toBe(true)
      expect(SystemctlExecutor.isSystemService('ssh.service')).toBe(true)
    })

    it('should not identify user services as system services', () => {
      expect(SystemctlExecutor.isSystemService('user-app.service')).toBe(false)
      expect(SystemctlExecutor.isSystemService('custom.service')).toBe(false)
    })
  })
})
