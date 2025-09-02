import { NextRequest, NextResponse } from 'next/server'
import { statusSweeper } from '@/lib/status-sweeper'

export async function GET() {
  try {
    return NextResponse.json({
      message: 'Sweeper endpoint working',
      timestamp: new Date().toISOString(),
      isActive: statusSweeper.isActive(),
      lastHeartbeat: statusSweeper.getLastHeartbeat().toISOString(),
    })
  } catch (error) {
    console.error('Error getting sweeper status:', error)
    return NextResponse.json(
      { error: 'Failed to get sweeper status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'start') {
      statusSweeper.start()
      return NextResponse.json({ 
        message: 'Status sweeper started',
        isActive: statusSweeper.isActive()
      })
    } else if (action === 'stop') {
      statusSweeper.stop()
      return NextResponse.json({ 
        message: 'Status sweeper stopped',
        isActive: statusSweeper.isActive()
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "start" or "stop"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error controlling status sweeper:', error)
    return NextResponse.json(
      { error: 'Failed to control status sweeper', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
