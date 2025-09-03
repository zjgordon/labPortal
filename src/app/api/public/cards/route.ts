import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  validatePublicToken,
  createInvalidTokenResponse,
} from '@/lib/auth/public-token';
import { ResponseHelper } from '@/lib/response-helper';

/**
 * GET /api/public/cards
 * Public endpoint for enabled cards - only exposes safe information
 * Requires valid public token via ?token= or Authorization: Bearer
 */
export async function GET(request: Request) {
  // Validate public token
  if (!validatePublicToken(request)) {
    return createInvalidTokenResponse();
  }

  try {
    const cards = await prisma.card.findMany({
      where: { isEnabled: true },
      orderBy: [{ group: 'asc' }, { order: 'asc' }],
      select: {
        id: true,
        title: true,
        description: true,
        group: true,
        // Exclude url for security - only expose title/description/group
        status: {
          select: {
            isUp: true,
            lastChecked: true,
            latencyMs: true,
            message: true,
          },
        },
      },
    });

    return ResponseHelper.success(cards, 'public');
  } catch (error) {
    console.error('Error fetching public cards:', error);
    return ResponseHelper.error('Failed to fetch cards', 'public', 500);
  }
}
