import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

// POST /api/cards/:id/icon - Upload card icon (protected)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Server-side authentication check
    const session = await getServerSession()
    if (!session?.user?.id || session.user.id !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Check if card exists
    const card = await prisma.card.findUnique({
      where: { id },
    })

    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('icon') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No icon file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG and JPEG are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB.' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    // Determine file extension
    const extension = file.type === 'image/png' ? 'png' : 'jpg'
    const filename = `${id}.${extension}`
    const filepath = join(uploadsDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Update card with new icon path
    const iconPath = `/uploads/${filename}`
    const updatedCard = await prisma.card.update({
      where: { id },
      data: { iconPath },
      include: {
        status: true,
      },
    })

    return NextResponse.json({
      success: true,
      iconPath,
      card: updatedCard,
    })
  } catch (error) {
    console.error('Error uploading icon:', error)
    return NextResponse.json(
      { error: 'Failed to upload icon' },
      { status: 500 }
    )
  }
}
