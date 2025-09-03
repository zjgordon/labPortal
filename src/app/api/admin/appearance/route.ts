import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth'
import { validateAdminOrigin } from '@/lib/auth/admin-auth'
import { appearanceUpdate } from '@/lib/validation/appearance'
import { prisma } from '@/lib/prisma'
import { getAppearance } from '@/lib/config/appearance'

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authError = await requireAdminAuth(request)
    if (authError) {
      return authError
    }

    // Get appearance configuration
    const appearance = await getAppearance()

    // Return appearance data
    return NextResponse.json({
      success: true,
      data: {
        instanceName: appearance.instanceName,
        headerText: appearance.headerText,
        theme: appearance.theme,
      },
    })
  } catch (error) {
    console.error('Admin appearance fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const authError = await requireAdminAuth(request)
    if (authError) {
      return authError
    }

    // Validate origin for admin endpoints
    const originValidation = validateAdminOrigin(request)
    if (!originValidation.isValid) {
      return NextResponse.json(
        { error: 'Invalid origin', details: originValidation.details },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = appearanceUpdate.parse(body)

    // Upsert appearance configuration
    const updatedAppearance = await prisma.appearance.upsert({
      where: { id: 1 },
      update: {
        instanceName: validatedData.instanceName,
        headerText: validatedData.headerText,
        theme: validatedData.theme || 'system',
        updatedAt: new Date(),
      },
      create: {
        id: 1,
        instanceName: validatedData.instanceName,
        headerText: validatedData.headerText,
        theme: validatedData.theme || 'system',
        showClock: false,
      },
    })

    // Invalidate in-memory cache
    await getAppearance(true)

    return NextResponse.json({
      success: true,
      data: {
        id: updatedAppearance.id,
        instanceName: updatedAppearance.instanceName,
        headerText: updatedAppearance.headerText,
        theme: updatedAppearance.theme,
        showClock: updatedAppearance.showClock,
        updatedAt: updatedAppearance.updatedAt,
      },
    })
  } catch (error) {
    console.error('Appearance update error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
