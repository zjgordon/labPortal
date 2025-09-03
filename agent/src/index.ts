#!/usr/bin/env node

import { Agent } from './agent'
import { Logger } from './logger'
import { loadConfig } from './config'

async function main() {
  const logger = new Logger()
  
  try {
    // Load and validate configuration
    logger.info('Loading agent configuration...')
    const config = loadConfig()
    logger.info(`Configuration loaded: host=${config.hostId}, portal=${config.portalBaseUrl}, timeout=${config.execTimeoutMs}ms, retry=${config.restartRetry}`)
    
    // Create and start agent
    const agent = new Agent()
    
    // Handle graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`)
      await agent.stop()
      process.exit(0)
    }
    
    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('SIGTERM', () => shutdown('SIGTERM'))
    
    // Start the agent
    logger.info('Starting Lab Portal Agent...')
    await agent.start()
    
  } catch (error) {
    logger.error('Failed to start agent:', error)
    process.exit(1)
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

main().catch((error) => {
  console.error('Main function failed:', error)
  process.exit(1)
})
