import { NextRequest } from 'next/server';

// Mock the singleton prisma instance first
jest.mock('@/lib/prisma', () => ({
  prisma: {
    card: {
      findMany: jest.fn(),
    },
    statusEvent: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Mock all dependencies
jest.mock('@/lib/auth/public-token', () => ({
  validatePublicToken: jest.fn(),
  createInvalidTokenResponse: jest.fn(() => {
    return new Response(
      JSON.stringify({ error: 'Invalid or missing public token' }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'WWW-Authenticate': 'Bearer',
        },
      }
    );
  }),
}));

jest.mock('@/lib/response-optimizer', () => ({
  ResponseOptimizer: {
    // Mock if needed for future optimizations
  },
}));

import { GET } from '../route';
import { prisma } from '@/lib/prisma';

describe('/api/public/status/summary', () => {
  const mockCards = [
    {
      id: 'card-1',
      title: 'Test Service',
      group: 'web',
      order: 1,
      status: {
        isUp: true,
        lastChecked: new Date('2024-01-01T12:00:00Z'),
        latencyMs: 150,
        message: 'OK',
      },
    },
    {
      id: 'card-2',
      title: 'Another Service',
      group: 'api',
      order: 2,
      status: {
        isUp: false,
        lastChecked: new Date('2024-01-01T12:00:00Z'),
        latencyMs: null,
        message: 'Connection timeout',
      },
    },
  ];

  const mockStatusEvents = [
    {
      cardId: 'card-1',
      timestamp: new Date('2024-01-01T12:00:00Z'),
      isUp: true,
      latencyMs: 150,
    },
    {
      cardId: 'card-1',
      timestamp: new Date('2024-01-01T11:00:00Z'),
      isUp: true,
      latencyMs: 120,
    },
    {
      cardId: 'card-2',
      timestamp: new Date('2024-01-01T12:00:00Z'),
      isUp: false,
      latencyMs: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Prisma responses
    (prisma.card.findMany as jest.Mock).mockResolvedValue(mockCards);
    (prisma.statusEvent.count as jest.Mock).mockResolvedValue(2); // For day/week event counts
    (prisma.statusEvent.findMany as jest.Mock).mockResolvedValue([
      { latencyMs: 150 },
      { latencyMs: 120 },
    ]);
  });

  describe('Authentication', () => {
    it('should return 401 when no token is provided', async () => {
      const { validatePublicToken } = require('@/lib/auth/public-token');
      validatePublicToken.mockReturnValue(false);

      const request = new NextRequest(
        'http://localhost:3000/api/public/status/summary'
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(validatePublicToken).toHaveBeenCalledWith(request);
    });

    it('should return 401 when invalid token is provided', async () => {
      const { validatePublicToken } = require('@/lib/auth/public-token');
      validatePublicToken.mockReturnValue(false);

      const request = new NextRequest(
        'http://localhost:3000/api/public/status/summary?token=invalid'
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(validatePublicToken).toHaveBeenCalledWith(request);
    });

    it('should return 200 when valid query token is provided', async () => {
      const { validatePublicToken } = require('@/lib/auth/public-token');
      validatePublicToken.mockReturnValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/public/status/summary?token=valid-token'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(validatePublicToken).toHaveBeenCalledWith(request);
    });

    it('should return 200 when valid Bearer token is provided', async () => {
      const { validatePublicToken } = require('@/lib/auth/public-token');
      validatePublicToken.mockReturnValue(true);

      const request = new NextRequest(
        'http://localhost:3000/api/public/status/summary',
        {
          headers: {
            Authorization: 'Bearer valid-token',
          },
        }
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(validatePublicToken).toHaveBeenCalledWith(request);
    });
  });

  describe('Response Headers', () => {
    beforeEach(() => {
      const { validatePublicToken } = require('@/lib/auth/public-token');
      validatePublicToken.mockReturnValue(true);
    });

    it('should set correct Content-Type header', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/public/status/summary'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe(
        'application/json; charset=utf-8'
      );
    });

    it('should set correct Cache-Control header for public caching', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/public/status/summary'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe(
        'public, max-age=5, stale-while-revalidate=30'
      );
    });
  });

  describe('Response Data', () => {
    beforeEach(() => {
      const { validatePublicToken } = require('@/lib/auth/public-token');
      validatePublicToken.mockReturnValue(true);
    });

    it('should return status summary with correct structure', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/public/status/summary'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('overall');
      expect(data).toHaveProperty('cards');

      expect(data.overall).toHaveProperty('totalCards', 2);
      expect(data.overall).toHaveProperty('upCards', 1);
      expect(data.overall).toHaveProperty('downCards', 1);
      expect(data.overall).toHaveProperty('uptime24h');
      expect(data.overall).toHaveProperty('uptime7d');

      expect(data.cards).toHaveLength(2);
      expect(data.cards[0]).toHaveProperty('id', 'card-1');
      expect(data.cards[0]).toHaveProperty('title', 'Test Service');
      expect(data.cards[0]).toHaveProperty('currentStatus');
      expect(data.cards[0]).toHaveProperty('uptime');
      expect(data.cards[0]).toHaveProperty('metrics');
    });

    it('should handle database errors gracefully', async () => {
      (prisma.card.findMany as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/public/status/summary'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch status summary' });
    });
  });
});
