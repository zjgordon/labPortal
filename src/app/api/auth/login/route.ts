import { NextRequest, NextResponse } from 'next/server'
import { signIn } from 'next-auth/react'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
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

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
