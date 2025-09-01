/**
 * Utility function to probe a URL and check if it's accessible
 * Uses fetch with AbortController for timeout handling
 */

export interface ProbeResult {
  isUp: boolean
  lastHttp?: number
  latencyMs: number
  message?: string
}

export async function probeUrl(url: string, timeoutMs: number = 3000): Promise<ProbeResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  const startTime = Date.now()
  
  try {
    // Try HEAD request first
    try {
      const headResponse = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        // Add some basic headers to avoid being blocked
        headers: {
          'User-Agent': 'LabPortal/1.0',
        },
      })
      
      clearTimeout(timeoutId)
      const latencyMs = Date.now() - startTime
      
      return {
        isUp: headResponse.status >= 200 && headResponse.status < 400,
        lastHttp: headResponse.status,
        latencyMs,
      }
    } catch (headError) {
      // If HEAD fails, try GET
      try {
        const getResponse = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'LabPortal/1.0',
          },
        })
        
        clearTimeout(timeoutId)
        const latencyMs = Date.now() - startTime
        
        return {
          isUp: getResponse.status >= 200 && getResponse.status < 400,
          lastHttp: getResponse.status,
          latencyMs,
        }
      } catch (getError) {
        clearTimeout(timeoutId)
        const latencyMs = Date.now() - startTime
        
        return {
          isUp: false,
          latencyMs,
          message: `GET request failed: ${getError instanceof Error ? getError.message : 'Unknown error'}`,
        }
      }
    }
  } catch (error) {
    clearTimeout(timeoutId)
    const latencyMs = Date.now() - startTime
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        isUp: false,
        latencyMs,
        message: `Request timeout after ${timeoutMs}ms`,
      }
    }
    
    return {
      isUp: false,
      latencyMs,
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
