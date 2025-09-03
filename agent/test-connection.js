#!/usr/bin/env node

// Simple test script to verify portal connection
// Run with: node test-connection.js

import { config } from 'dotenv'
import { PortalClient } from './src/portal-client.js'

// Load environment variables
config()

async function testConnection() {
  console.log('🧪 Testing Lab Portal Agent Connection...\n')
  
  // Check environment variables
  const required = ['HOST_ID', 'PORTAL_BASE_URL', 'AGENT_TOKEN']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    missing.forEach(key => console.error(`   ${key}`))
    console.error('\nPlease check your .env file')
    process.exit(1)
  }
  
  console.log('✅ Environment variables loaded:')
  console.log(`   HOST_ID: ${process.env.HOST_ID}`)
  console.log(`   PORTAL_BASE_URL: ${process.env.PORTAL_BASE_URL}`)
  console.log(`   AGENT_TOKEN: ${process.env.AGENT_TOKEN ? 'SET' : 'NOT SET'}`)
  console.log()
  
  try {
    const client = new PortalClient()
    
    console.log('🔄 Testing heartbeat...')
    await client.sendHeartbeat()
    console.log('✅ Heartbeat successful')
    
    console.log('🔄 Testing action queue...')
    const actions = await client.getQueuedActions(1)
    console.log(`✅ Queue check successful (${actions.length} actions available)`)
    
    console.log('\n🎉 All tests passed! Agent is ready to run.')
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
    console.error('\nTroubleshooting:')
    console.error('1. Check PORTAL_BASE_URL is correct')
    console.error('2. Verify AGENT_TOKEN is valid')
    console.error('3. Ensure portal is running and accessible')
    console.error('4. Check network connectivity')
    process.exit(1)
  }
}

testConnection().catch(console.error)
