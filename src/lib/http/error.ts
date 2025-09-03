import { NextResponse } from 'next/server'

/**
 * Custom API error class for consistent error handling
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
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
export function createApiError(code: ErrorCode, message: string): { error: { code: string; message: string } } {
  return {
    error: {
      code,
      message
    }
  }
}

/**
 * Sends a consistent error response using NextResponse
 * @param res - The NextResponse object (can be undefined for compatibility)
 * @param err - The error to send (ApiError, Error, or any other error)
 * @returns NextResponse with proper error format
 */
export function sendError(
  res: NextResponse | undefined,
  err: unknown
): NextResponse {
  let status = 500
  let code: ErrorCode = ErrorCodes.INTERNAL_ERROR
  let message = 'Internal server error'

  if (err instanceof ApiError) {
    status = err.status
    code = err.code as ErrorCode
    message = err.message
  } else if (err instanceof Error) {
    message = err.message
    // Try to infer status from common error patterns
    if (err.message.includes('not found') || err.message.includes('NotFound')) {
      status = 404
      code = ErrorCodes.NOT_FOUND
    } else if (err.message.includes('unauthorized') || err.message.includes('Unauthorized')) {
      status = 401
      code = ErrorCodes.UNAUTHORIZED
    } else if (err.message.includes('forbidden') || err.message.includes('Forbidden')) {
      status = 403
      code = ErrorCodes.FORBIDDEN
    } else if (err.message.includes('validation') || err.message.includes('Validation')) {
      status = 400
      code = ErrorCodes.VALIDATION_ERROR
    }
  } else if (typeof err === 'string') {
    message = err
  } else if (err && typeof err === 'object' && 'message' in err) {
    message = String(err.message)
  }

  const response = NextResponse.json(
    createApiError(code, message),
    { status }
  )
  
  // Set security headers
  response.headers.set('Cache-Control', 'no-store')
  
  // Add Vary: Authorization for auth-related errors
  if (code.includes('AGENT') || code.includes('TOKEN') || code === ErrorCodes.COOKIES_NOT_ALLOWED) {
    response.headers.set('Vary', 'Authorization')
  }
  
  return response
}

/**
 * Creates a NextResponse with uniform error format (legacy compatibility)
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
