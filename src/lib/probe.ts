/**
 * Utility function to probe a URL and check if it's accessible
 * Enhanced with healthPath support and HEAD/GET retry logic
 */

export interface ProbeResult {
  isUp: boolean
  lastHttp?: number
  latencyMs: number
  message?: string
}

export async function probeUrl(
  url: string, 
  healthPath?: string | null, 
  timeoutMs: number = 3000
): Promise<ProbeResult> {
  const startTime = Date.now()
  
  try {
    // Build the probe URL: if healthPath exists, join it with the base URL
    let probeUrl: string
    if (healthPath) {
      // Ensure URL doesn't end with slash and healthPath starts with /
      const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url
      const cleanHealthPath = healthPath.startsWith('/') ? healthPath : `/${healthPath}`
      probeUrl = `${cleanUrl}${cleanHealthPath}`
    } else {
      probeUrl = url
    }

    // Parse the URL to determine protocol
    let parsedUrl: URL
    try {
      parsedUrl = new URL(probeUrl)
    } catch {
      // If URL parsing fails, try to construct a valid URL
      if (probeUrl.startsWith('/')) {
        // Relative path - assume localhost
        parsedUrl = new URL(`http://localhost${probeUrl}`)
      } else if (!probeUrl.startsWith('http://') && !probeUrl.startsWith('https://')) {
        // No protocol - assume http
        parsedUrl = new URL(`http://${probeUrl}`)
      } else {
        throw new Error('Invalid URL format')
      }
    }

    // Use appropriate module based on protocol
    const httpModule = parsedUrl.protocol === 'https:' ? require('https') : require('http')
    
    // Try HEAD first, then GET if HEAD fails
    return await tryProbeWithMethod(httpModule, parsedUrl, timeoutMs, startTime, 'HEAD')
      .catch(async () => {
        // If HEAD fails, try GET as fallback
        return await tryProbeWithMethod(httpModule, parsedUrl, timeoutMs, startTime, 'GET')
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

/**
 * Helper function to probe with a specific HTTP method
 */
async function tryProbeWithMethod(
  httpModule: any,
  parsedUrl: URL,
  timeoutMs: number,
  startTime: number,
  method: 'HEAD' | 'GET'
): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      const latencyMs = Date.now() - startTime
      reject(new Error(`Request timeout after ${timeoutMs}ms`))
    }, timeoutMs)

    const request = httpModule.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: method,
        timeout: timeoutMs,
        headers: {
          'User-Agent': 'LabPortal/1.0',
        },
      },
      (response: any) => {
        clearTimeout(timeoutId)
        const latencyMs = Date.now() - startTime
        
        // Treat 200-399 as up, anything else as down
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
      
      // Special handling for common errors
      let message = `Connection failed: ${error.message || 'Unknown error'}`
      if (error.code === 'ECONNREFUSED') {
        message = 'Connection refused - service not running'
      } else if (error.code === 'ENOTFOUND') {
        message = 'Host not found - check network configuration'
      } else if (error.code === 'ETIMEDOUT') {
        message = 'Connection timed out - service may be overloaded'
      } else if (error.code === 'ECONNRESET') {
        message = 'Connection reset by peer'
      }
      
      reject(new Error(message))
    })

    request.end()
  })
}
