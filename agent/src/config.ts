/**
 * Agent configuration interface
 */
export interface AgentConfig {
  // Host identification
  hostId: string
  
  // Portal connection
  portalBaseUrl: string
  agentToken: string
  
  // Timing configuration
  pollInterval: number
  execTimeoutMs: number
  
  // Retry configuration
  restartRetry: number
  
  // Environment
  nodeEnv: string
}

/**
 * Load and validate agent configuration from environment variables
 */
export function loadConfig(): AgentConfig {
  const config: AgentConfig = {
    // Host identification
    hostId: process.env.HOST_ID || 'unknown-host',
    
    // Portal connection
    portalBaseUrl: process.env.PORTAL_BASE_URL || 'http://localhost:3000',
    agentToken: process.env.AGENT_TOKEN || '',
    
    // Timing configuration
    pollInterval: parseInt(process.env.POLL_INTERVAL || '4000', 10),
    execTimeoutMs: parseInt(process.env.EXEC_TIMEOUT_MS || '60000', 10),
    
    // Retry configuration
    restartRetry: parseInt(process.env.RESTART_RETRY || '1', 10),
    
    // Environment
    nodeEnv: process.env.NODE_ENV || 'production',
  }

  // Validate required configuration
  if (!config.agentToken) {
    throw new Error('AGENT_TOKEN environment variable is required')
  }

  if (!config.portalBaseUrl) {
    throw new Error('PORTAL_BASE_URL environment variable is required')
  }

  // Validate numeric values
  if (config.pollInterval <= 0) {
    throw new Error('POLL_INTERVAL must be greater than 0')
  }

  if (config.execTimeoutMs <= 0) {
    throw new Error('EXEC_TIMEOUT_MS must be greater than 0')
  }

  if (config.restartRetry < 0) {
    throw new Error('RESTART_RETRY must be 0 or greater')
  }

  return config
}

/**
 * Get configuration singleton
 */
let _config: AgentConfig | null = null

export function getConfig(): AgentConfig {
  if (!_config) {
    _config = loadConfig()
  }
  return _config
}
