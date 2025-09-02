import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'
import { existsSync } from 'fs'

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

    // Validate file type and size
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG, JPEG, and WebP are allowed.' },
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

    // Generate PNG filename
    const filename = `${id}.png`
    const filepath = join(uploadsDir, filename)

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Process image with Sharp: re-encode as PNG, strip EXIF, optimize
    try {
      const processedImage = await sharp(buffer)
        .resize(128, 128, { 
          fit: 'inside', 
          withoutEnlargement: true,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ 
          quality: 90,
          compressionLevel: 9,
          progressive: false
        })
        .toBuffer()

      // Save processed PNG
      await writeFile(filepath, processedImage)
    } catch (sharpError) {
      console.error('Sharp processing error:', sharpError)
      return NextResponse.json(
        { error: 'Failed to process image. Please ensure it\'s a valid image file.' },
        { status: 400 }
      )
    }

    // Clean up old icon if it exists and is different
    if (card.iconPath && card.iconPath !== `/uploads/${filename}`) {
      const oldIconPath = join(process.cwd(), 'public', card.iconPath.replace(/^\//, ''))
      if (existsSync(oldIconPath)) {
        try {
          await unlink(oldIconPath)
        } catch (cleanupError) {
          console.warn('Failed to cleanup old icon:', cleanupError)
        }
      }
    }

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
