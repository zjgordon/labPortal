#!/usr/bin/env node

import { config } from 'dotenv'
import { Agent } from './agent'

// Load environment variables
config()

async function main() {
  const agent = new Agent()
  
  console.log('🚀 Lab Portal Agent starting...')
  console.log(`📍 Host ID: ${process.env.HOST_ID || 'NOT SET'}`)
  console.log(`🌐 Portal URL: ${process.env.PORTAL_BASE_URL || 'NOT SET'}`)
  console.log(`🔑 Token: ${process.env.AGENT_TOKEN ? 'SET' : 'NOT SET'}`)
  console.log(`⏱️  Poll Interval: ${process.env.POLL_INTERVAL || 4000}ms`)
  
  // Validate required environment variables
  if (!process.env.HOST_ID || !process.env.PORTAL_BASE_URL || !process.env.AGENT_TOKEN) {
    console.error('❌ Missing required environment variables:')
    console.error('   HOST_ID: Your host identifier')
    console.error('   PORTAL_BASE_URL: Base URL of the Lab Portal (e.g., http://localhost:3000)')
    console.error('   AGENT_TOKEN: Authentication token from the portal')
    process.exit(1)
  }
  
  try {
    await agent.start()
  } catch (error) {
    console.error('❌ Agent failed to start:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...')
  process.exit(0)
})

// Start the agent
main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
