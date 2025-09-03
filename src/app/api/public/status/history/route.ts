import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  validatePublicToken,
  createInvalidTokenResponse,
} from '@/lib/auth/public-token';
import { ResponseHelper } from '@/lib/response-helper';

const historyQuerySchema = z.object({
  cardId: z.string().min(1),
  range: z.enum(['24h', '7d']),
});

/**
 * GET /api/public/status/history?cardId=...&range=24h|7d
 * Public endpoint for status history - only exposes safe information
 * Requires valid public token via ?token= or Authorization: Bearer
 */
export async function GET(request: Request) {
  // Validate public token
  if (!validatePublicToken(request)) {
    return createInvalidTokenResponse();
  }

  try {
    const url = new URL(request.url);
    const cardId = url.searchParams.get('cardId');
    const range = url.searchParams.get('range');

    // Validate query parameters
    const validatedParams = historyQuerySchema.parse({ cardId, range });

    // Calculate time range
    const now = new Date();
    let startTime: Date;

    switch (validatedParams.range) {
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        return ResponseHelper.error('Invalid range parameter', 'public', 400);
    }

    // Verify card exists and is enabled
    const card = await prisma.card.findUnique({
      where: { id: validatedParams.cardId },
      select: { id: true, isEnabled: true },
    });

    if (!card) {
      return ResponseHelper.error('Card not found', 'public', 404);
    }

    if (!card.isEnabled) {
      return ResponseHelper.error('Card is disabled', 'public', 400);
    }

    // Get all events in the time range
    const events = await prisma.statusEvent.findMany({
      where: {
        cardId: validatedParams.cardId,
        timestamp: {
          gte: startTime,
          lte: now,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
      select: {
        timestamp: true,
        isUp: true,
        http: true,
        latencyMs: true,
        message: true,
      },
    });

    // Downsample to <= 500 points
    const maxPoints = 500;
    let downsampledEvents = events;

    if (events.length > maxPoints) {
      const step = Math.ceil(events.length / maxPoints);
      downsampledEvents = [];

      for (let i = 0; i < events.length; i += step) {
        const event = events[i];
        if (event) {
          downsampledEvents.push(event);
        }
      }

      // Always include the last event
      const lastDownsampledEvent =
        downsampledEvents[downsampledEvents.length - 1];
      const lastEvent = events[events.length - 1];
      if (lastDownsampledEvent !== lastEvent && lastEvent) {
        downsampledEvents.push(lastEvent);
      }
    }

    // Calculate uptime percentage
    const totalEvents = events.length;
    const upEvents = events.filter((e) => e.isUp).length;
    const uptimePercentage =
      totalEvents > 0 ? (upEvents / totalEvents) * 100 : 0;

    // Calculate average latency
    const latencyEvents = events.filter((e) => e.latencyMs !== null);
    const avgLatency =
      latencyEvents.length > 0
        ? latencyEvents.reduce((sum, e) => sum + (e.latencyMs || 0), 0) /
          latencyEvents.length
        : null;

    const responseData = {
      cardId: validatedParams.cardId,
      range: validatedParams.range,
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      totalEvents,
      uptimePercentage: Math.round(uptimePercentage * 100) / 100, // Round to 2 decimal places
      avgLatency: avgLatency ? Math.round(avgLatency) : null,
      events: downsampledEvents.map((e) => ({
        timestamp: e.timestamp.toISOString(),
        isUp: e.isUp,
        http: e.http,
        latencyMs: e.latencyMs,
        message: e.message,
      })),
    };

    return ResponseHelper.success(responseData, 'public');
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return ResponseHelper.error('Invalid query parameters', 'public', 400);
    }

    console.error('Error fetching public status history:', error);
    return ResponseHelper.error(
      'Failed to fetch status history',
      'public',
      500
    );
  }
}
