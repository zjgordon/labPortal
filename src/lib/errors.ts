import { NextResponse } from 'next/server'

/**
 * Uniform error response shape for admin and agent endpoints
 */
export interface ApiError {
  error: {
    code: string
    message: string
  }
}

/**
 * Common error codes for consistent error handling
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  SESSION_REQUIRED: 'SESSION_REQUIRED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Business Logic
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  ACTION_LOCKED: 'ACTION_LOCKED',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // Agent-specific
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  HOST_MISMATCH: 'HOST_MISMATCH',
  COOKIES_NOT_ALLOWED: 'COOKIES_NOT_ALLOWED'
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

/**
 * Creates a uniform error response
 */
export function createApiError(code: ErrorCode, message: string): ApiError {
  return {
    error: {
      code,
      message
    }
  }
}

/**
 * Creates a NextResponse with uniform error format
 */
export function createErrorResponse(
  code: ErrorCode, 
  message: string, 
  status: number,
  headers?: Record<string, string>
): NextResponse {
  const response = NextResponse.json(
    createApiError(code, message),
    { status }
  )
  
  // Set headers
  response.headers.set('Cache-Control', 'no-store')
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }
  
  // Add Vary: Authorization for agent-related errors
  if (code.includes('AGENT') || code.includes('TOKEN') || code === ErrorCodes.COOKIES_NOT_ALLOWED) {
    response.headers.set('Vary', 'Authorization')
  }
  
  return response
}
