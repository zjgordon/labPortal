#!/usr/bin/env node

/**
 * Migration script to convert existing plaintext agent tokens to hashed tokens
 * Run this after applying the database migration
 */

const { PrismaClient } = require('@prisma/client')
const { createHash } = require('crypto')

const prisma = new PrismaClient()

async function migrateTokens() {
  try {
    console.log('Starting token migration...')
    
    // Get all hosts with existing agent tokens
    const hosts = await prisma.host.findMany({
      where: {
        agentToken: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        agentToken: true
      }
    })
    
    console.log(`Found ${hosts.length} hosts with existing tokens`)
    
    for (const host of hosts) {
      try {
        const oldToken = host.agentToken
        
        // Generate hash and prefix for existing token
        const tokenHash = createHash('sha256').update(oldToken).digest('hex')
        const tokenPrefix = oldToken.substring(0, 8)
        
        // Update host with new hashed fields
        await prisma.host.update({
          where: { id: host.id },
          data: {
            agentTokenHash: tokenHash,
            agentTokenPrefix: tokenPrefix,
            tokenRotatedAt: new Date(),
            updatedAt: new Date()
          }
        })
        
        console.log(`✓ Migrated host: ${host.name} (${host.id})`)
        console.log(`  Old token: ${oldToken.substring(0, 8)}...`)
        console.log(`  New hash: ${tokenHash.substring(0, 16)}...`)
        console.log(`  New prefix: ${tokenPrefix}`)
        
      } catch (error) {
        console.error(`✗ Failed to migrate host ${host.id}:`, error.message)
      }
    }
    
    console.log('\nMigration completed!')
    console.log('\nNext steps:')
    console.log('1. Verify all tokens were migrated correctly')
    console.log('2. Test authentication with existing tokens')
    console.log('3. Run: ALTER TABLE "Host" DROP COLUMN "agentToken"')
    console.log('4. Update any remaining code that references agentToken')
    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateTokens()
}

module.exports = { migrateTokens }
