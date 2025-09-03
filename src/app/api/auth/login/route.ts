import { NextRequest, NextResponse } from 'next/server'
import { signIn } from 'next-auth/react'
import { createErrorResponse, ErrorCodes } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return createErrorResponse(
        ErrorCodes.MISSING_REQUIRED_FIELD,
        'Email and password are required',
        400
      )
    }

    // For now, use the same credentials as in NextAuth config
    // In production, this should integrate with your authentication system
    if (email === 'admin@local' && password === 'admin123') {
      // Generate a simple token (in production, use proper JWT)
      const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')
      
      return NextResponse.json({
        success: true,
        token,
        user: { email, name: 'Admin' }
      })
    }

    return createErrorResponse(
      ErrorCodes.UNAUTHORIZED,
      'Invalid credentials',
      401
    )
  } catch (error) {
    console.error('Login error:', error)
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Internal server error',
      500
    )
  }
}
