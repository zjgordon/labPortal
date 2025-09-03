// Re-export everything from the new http error module
export * from './http/error'

// Legacy compatibility - these functions are now in http/error.ts
// but we keep them here to avoid breaking existing imports
