import { NextRequest, NextResponse } from 'next/server'
import { getAppearance } from '@/lib/config/appearance'
import { env } from '@/lib/env'

export async function GET(request: NextRequest) {
  try {
    // Debug environment variable loading
    console.log('Public API - All env vars:', {
      READONLY_PUBLIC_TOKEN: env.READONLY_PUBLIC_TOKEN,
      NODE_ENV: env.NODE_ENV,
      DATABASE_URL: env.DATABASE_URL ? 'SET' : 'NOT SET'
    })
    
    // Check for READONLY_PUBLIC_TOKEN in Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    console.log('Public API - Token from header:', token)
    console.log('Public API - Expected token:', env.READONLY_PUBLIC_TOKEN)
    console.log('Public API - Token comparison:', token === env.READONLY_PUBLIC_TOKEN)
    
    // Temporary fix: hardcode token for testing
    const expectedToken = env.READONLY_PUBLIC_TOKEN || 'test-public-token'
    
    if (!token || token !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get appearance configuration
    const appearance = await getAppearance()

    // Return only the public fields
    const publicData = {
      instanceName: appearance.instanceName,
      headerText: appearance.headerText,
      theme: appearance.theme,
    }

    const response = NextResponse.json({
      success: true,
      data: publicData,
    })

    // Set cache headers
    response.headers.set('Cache-Control', 'public, max-age=5, stale-while-revalidate=30')
    
    return response
  } catch (error) {
    console.error('Public appearance fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
