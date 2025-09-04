import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify origin for CSRF protection
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && !origin.includes(host || '')) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Invalid origin' },
        { status: 403 }
      );
    }

    // Clear existing data in the correct order
    await prisma.action.deleteMany();
    await prisma.managedService.deleteMany();
    await prisma.statusEvent.deleteMany();
    await prisma.cardStatus.deleteMany();
    await prisma.card.deleteMany();

    return NextResponse.json({
      success: true,
      message: 'All cards cleared successfully',
      data: {
        cardsDeleted: 'all',
        categories: [],
      },
    });
  } catch (error) {
    console.error('Error clearing cards:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to clear all cards',
      },
      { status: 500 }
    );
  }
}
