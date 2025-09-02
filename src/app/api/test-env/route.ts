import { NextRequest, NextResponse } from 'next/server'
import { probeUrl } from '@/lib/probe'

// GET /api/test-env - Test environment connectivity
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const testUrl = searchParams.get('url') || 'http://localhost:7860'
    
    console.log(`Testing connectivity to: ${testUrl}`)
    
    // Test the URL
    const result = await probeUrl(testUrl, 5000)
    
    return NextResponse.json({
      url: testUrl,
      result,
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      }
    })
    
  } catch (error) {
    console.error('Error in test-env endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
