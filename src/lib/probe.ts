/**
 * Utility function to probe a URL and check if it's accessible
 * Simple approach: if we get a 200 response, it's up
 */

export interface ProbeResult {
  isUp: boolean
  lastHttp?: number
  latencyMs: number
  message?: string
}

export async function probeUrl(url: string, timeoutMs: number = 5000): Promise<ProbeResult> {
  const startTime = Date.now()
  
  try {
    // Parse the URL to determine protocol
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      // If URL parsing fails, try to construct a valid URL
      if (url.startsWith('/')) {
        // Relative path - assume localhost
        parsedUrl = new URL(`http://localhost${url}`)
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // No protocol - assume http
        parsedUrl = new URL(`http://${url}`)
      } else {
        throw new Error('Invalid URL format')
      }
    }

    // Special handling for localhost URLs (common in lab environments)
    if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
      // For localhost, we'll use a shorter timeout and be more lenient
      timeoutMs = Math.min(timeoutMs, 3000)
    }

    // Use appropriate module based on protocol
    const httpModule = parsedUrl.protocol === 'https:' ? require('https') : require('http')
    
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        const latencyMs = Date.now() - startTime
        resolve({
          isUp: false,
          latencyMs,
          message: `Request timeout after ${timeoutMs}ms`,
        })
      }, timeoutMs)

      const request = httpModule.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'GET',
          timeout: timeoutMs,
          headers: {
            'User-Agent': 'LabPortal/1.0',
          },
        },
        (response: any) => {
          clearTimeout(timeoutId)
          const latencyMs = Date.now() - startTime
          
          // Simple logic: 200-399 means up, anything else means down
          const isUp = response.statusCode >= 200 && response.statusCode < 400
          
          resolve({
            isUp,
            lastHttp: response.statusCode,
            latencyMs,
            message: `HTTP ${response.statusCode}`,
          })
        }
      )

      request.on('error', (error: any) => {
        clearTimeout(timeoutId)
        const latencyMs = Date.now() - startTime
        
        // Special handling for common localhost errors
        let message = `Connection failed: ${error.message || 'Unknown error'}`
        if (error.code === 'ECONNREFUSED') {
          message = 'Connection refused - service not running'
        } else if (error.code === 'ENOTFOUND') {
          message = 'Host not found - check network configuration'
        } else if (error.code === 'ETIMEDOUT') {
          message = 'Connection timed out - service may be overloaded'
        }
        
        resolve({
          isUp: false,
          latencyMs,
          message,
        })
      })

      request.end()
    })
    
  } catch (error) {
    const latencyMs = Date.now() - startTime
    
    return {
      isUp: false,
      latencyMs,
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
