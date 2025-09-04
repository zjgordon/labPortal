import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { createErrorResponse, ErrorCodes } from '@/lib/errors';
import {
  verifyOrigin,
  createCsrfErrorResponse,
} from '@/lib/auth/csrf-protection';
import { z } from 'zod';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const updateControlPlaneSchema = z.object({
  enabled: z.boolean(),
});

// GET /api/admin/control-plane - Get control plane setting
export async function GET() {
  try {
    // Admin authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id !== 'admin') {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
    }

    const appearance = await prisma.appearance.findUnique({
      where: { id: 1 },
      select: { controlPlaneEnabled: true },
    });

    return NextResponse.json({
      enabled: appearance?.controlPlaneEnabled ?? false,
    });
  } catch (error) {
    console.error('Error fetching control plane setting:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch control plane setting',
      500
    );
  }
}

// PUT /api/admin/control-plane - Update control plane setting
export async function PUT(request: NextRequest) {
  try {
    // Admin authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id !== 'admin') {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401);
    }

    // CSRF protection for state-changing methods
    if (!verifyOrigin(request)) {
      return createCsrfErrorResponse(request);
    }

    const body = await request.json();
    const { enabled } = updateControlPlaneSchema.parse(body);

    // Update or create the appearance record
    const appearance = await prisma.appearance.upsert({
      where: { id: 1 },
      update: { controlPlaneEnabled: enabled },
      create: {
        id: 1,
        controlPlaneEnabled: enabled,
        instanceName: 'Lab Portal',
        headerText: null,
        showClock: false,
        theme: 'system',
      },
      select: { controlPlaneEnabled: true },
    });

    return NextResponse.json({
      enabled: appearance.controlPlaneEnabled,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Validation failed',
        400
      );
    }

    console.error('Error updating control plane setting:', error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to update control plane setting',
      500
    );
  }
}
