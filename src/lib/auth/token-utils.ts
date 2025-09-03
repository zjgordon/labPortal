import { createHash } from 'crypto'

export interface TokenInfo {
  plaintext: string
  prefix: string
  hash: string
}

/**
 * Generate a secure agent token using crypto.randomBytes
 * Returns the plaintext token, prefix (first 8 chars), and SHA-256 hash
 */
export function generateAgentToken(): TokenInfo {
  // Generate 32 random bytes (256 bits)
  const randomBytes = require('crypto').randomBytes(32)
  const plaintext = randomBytes.toString('hex')
  
  // Extract first 8 characters as prefix
  const prefix = plaintext.substring(0, 8)
  
  // Generate SHA-256 hash of the token
  const hash = createHash('sha256').update(plaintext).digest('hex')
  
  return {
    plaintext,
    prefix,
    hash
  }
}

/**
 * Verify a token against a stored hash
 */
export function verifyAgentToken(token: string, storedHash: string): boolean {
  const computedHash = createHash('sha256').update(token).digest('hex')
  return computedHash === storedHash
}

/**
 * Generate a token prefix from a plaintext token
 */
export function getTokenPrefix(token: string): string {
  return token.substring(0, 8)
}

/**
 * Generate a token hash from a plaintext token
 */
export function getTokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
