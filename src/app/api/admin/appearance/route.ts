import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { validateAdminOrigin } from '@/lib/auth/admin-auth';
import { appearanceUpdate } from '@/lib/validation/appearance';
import { prisma } from '@/lib/prisma';
import { getAppearance } from '@/lib/config/appearance';
import { ResponseHelper } from '@/lib/response-helper';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authError = await requireAdminAuth(request);
    if (authError) {
      return authError;
    }

    // Get appearance configuration
    const appearance = await getAppearance();

    // Return appearance data
    return ResponseHelper.success(
      {
        success: true,
        data: {
          instanceName: appearance.instanceName,
          headerText: appearance.headerText,
          theme: appearance.theme,
        },
      },
      'admin'
    );
  } catch (error) {
    console.error('Admin appearance fetch error:', error);
    return ResponseHelper.error('Internal server error', 'admin', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const authError = await requireAdminAuth(request);
    if (authError) {
      return authError;
    }

    // Validate origin for admin endpoints
    const originValidation = validateAdminOrigin(request);
    if (!originValidation.isValid) {
      return ResponseHelper.error('Invalid origin', 'admin', 403);
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = appearanceUpdate.parse(body);

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
    });

    // Invalidate in-memory cache
    await getAppearance(true);

    return ResponseHelper.success(
      {
        success: true,
        data: {
          id: updatedAppearance.id,
          instanceName: updatedAppearance.instanceName,
          headerText: updatedAppearance.headerText,
          theme: updatedAppearance.theme,
          showClock: updatedAppearance.showClock,
          updatedAt: updatedAppearance.updatedAt,
        },
      },
      'admin'
    );
  } catch (error) {
    console.error('Appearance update error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return ResponseHelper.error('Validation failed', 'admin', 400);
    }

    return ResponseHelper.error('Internal server error', 'admin', 500);
  }
}
