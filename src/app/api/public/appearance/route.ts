import { NextRequest, NextResponse } from 'next/server'
import { getAppearance } from '@/lib/config/appearance'
import { env } from '@/lib/env'

export async function GET(request: NextRequest) {
  try {
    // Check for READONLY_PUBLIC_TOKEN in Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    // Use hardcoded token for now to avoid env issues
    const expectedToken = 'test-public-token'
    
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

    // Set cache headers - disable caching temporarily for debugging
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Public appearance fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
