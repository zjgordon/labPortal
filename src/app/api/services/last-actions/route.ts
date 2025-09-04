import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, rejectAgentTokens } from '@/lib/auth';
import { ResponseHelper } from '@/lib/response-helper';

/**
 * GET /api/services/last-actions - Get the last action for each service
 */
export async function GET(request: NextRequest) {
  try {
    const agentRejection = await rejectAgentTokens(request);
    if (agentRejection) return agentRejection;

    const authError = await requireAdminAuth(request);
    if (authError) return authError;

    // Get all services with their last action
    const services = await prisma.managedService.findMany({
      include: {
        host: {
          select: {
            id: true,
            name: true,
          },
        },
        card: {
          select: {
            id: true,
            title: true,
          },
        },
        actions: {
          orderBy: {
            requestedAt: 'desc',
          },
          take: 1,
          select: {
            id: true,
            kind: true,
            status: true,
            requestedAt: true,
            startedAt: true,
            finishedAt: true,
            exitCode: true,
            message: true,
            requestedBy: true,
          },
        },
      },
    });

    // Transform the data to include last action info
    const servicesWithLastAction = services.map((service) => ({
      id: service.id,
      displayName: service.displayName,
      unitName: service.unitName,
      host: service.host,
      card: service.card,
      lastAction: service.actions[0] || null,
    }));

    return ResponseHelper.success(servicesWithLastAction, 'admin');
  } catch (error) {
    console.error('Failed to fetch services with last actions:', error);
    return ResponseHelper.error(
      'Failed to fetch services with last actions',
      'admin',
      500
    );
  }
}
