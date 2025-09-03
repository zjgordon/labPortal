// Export the new principal-based authentication system
export * from './principal'
export * from './wrappers'
export * from './token-utils'
export * from './csrf-protection'

// Export legacy functions for backward compatibility during transition
export { 
  isAdminAuthenticated,
  requireAdminAuth,
  isAgentAuthenticated,
  getHostFromToken,
  requireAgentAuth,
  rejectAgentTokens,
  generateAgentToken
} from '../auth'
