import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, rejectAgentTokens } from '@/lib/auth';
import { ResponseHelper } from '@/lib/response-helper';

/**
 * GET /api/control/diagnostics - Admin-only diagnostic endpoint
 * Returns system health information for troubleshooting
 */
export async function GET(request: NextRequest) {
  try {
    const agentRejection = await rejectAgentTokens(request);
    if (agentRejection) return agentRejection;

    const authError = await requireAdminAuth(request);
    if (authError) return authError;

    // Get counts of queued and running actions
    const [queuedCount, runningCount] = await Promise.all([
      prisma.action.count({
        where: { status: 'queued' },
      }),
      prisma.action.count({
        where: { status: 'running' },
      }),
    ]);

    // Get last seen per host
    const hosts = await prisma.host.findMany({
      select: {
        id: true,
        name: true,
        lastSeenAt: true,
        address: true,
      },
      orderBy: {
        lastSeenAt: 'desc',
      },
    });

    // Get count of failed actions in last 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const failedActionsCount = await prisma.action.count({
      where: {
        status: 'failed',
        requestedAt: {
          gte: twentyFourHoursAgo,
        },
      },
    });

    // Get recent failed actions for context
    const recentFailedActions = await prisma.action.findMany({
      where: {
        status: 'failed',
        requestedAt: {
          gte: twentyFourHoursAgo,
        },
      },
      select: {
        id: true,
        kind: true,
        requestedAt: true,
        message: true,
        host: {
          select: {
            name: true,
          },
        },
        service: {
          select: {
            displayName: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
      take: 10,
    });

    // Get action statistics by status for last 24h
    const actionStats = await prisma.action.groupBy({
      by: ['status'],
      where: {
        requestedAt: {
          gte: twentyFourHoursAgo,
        },
      },
      _count: {
        status: true,
      },
    });

    // Get action statistics by kind for last 24h
    const actionKindStats = await prisma.action.groupBy({
      by: ['kind'],
      where: {
        requestedAt: {
          gte: twentyFourHoursAgo,
        },
      },
      _count: {
        kind: true,
      },
    });

    // Get system uptime and basic info
    const systemInfo = {
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };

    const diagnostics = {
      actionCounts: {
        queued: queuedCount,
        running: runningCount,
        failedLast24h: failedActionsCount,
      },
      hosts: hosts.map((host) => ({
        id: host.id,
        name: host.name,
        address: host.address,
        lastSeenAt: host.lastSeenAt,
        isOnline: host.lastSeenAt
          ? Date.now() - host.lastSeenAt.getTime() < 5 * 60 * 1000 // Online if seen within 5 minutes
          : false,
        lastSeenAge: host.lastSeenAt
          ? Math.round((Date.now() - host.lastSeenAt.getTime()) / 1000)
          : null,
      })),
      recentFailures: recentFailedActions.map((action) => ({
        id: action.id,
        kind: action.kind,
        requestedAt: action.requestedAt,
        message: action.message,
        host: action.host.name,
        service: action.service.displayName,
      })),
      statistics: {
        last24h: {
          byStatus: actionStats.reduce(
            (acc, stat) => {
              acc[stat.status] = stat._count.status;
              return acc;
            },
            {} as Record<string, number>
          ),
          byKind: actionKindStats.reduce(
            (acc, stat) => {
              acc[stat.kind] = stat._count.kind;
              return acc;
            },
            {} as Record<string, number>
          ),
        },
      },
      system: systemInfo,
    };

    return ResponseHelper.success(diagnostics, 'admin');
  } catch (error) {
    console.error('Failed to fetch diagnostics:', error);
    return ResponseHelper.error('Failed to fetch diagnostics', 'admin', 500);
  }
}
