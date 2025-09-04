import { NextRequest } from 'next/server';

// Mock the singleton prisma instance first
jest.mock('@/lib/prisma', () => ({
  prisma: {
    appearance: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock all dependencies
jest.mock('@/lib/config/appearance', () => ({
  getAppearance: jest.fn(),
}));

jest.mock('@/lib/response-helper', () => ({
  ResponseHelper: {
    success: jest.fn((data: any, routeType: string, status = 200) => {
      const response = {
        status,
        headers: new Map([
          ['Content-Type', 'application/json; charset=utf-8'],
          ['Cache-Control', 'public, max-age=5, stale-while-revalidate=30'],
        ]),
        get: (key: string) => response.headers.get(key),
        json: () => Promise.resolve(data),
      };
      return response;
    }),
    error: jest.fn((error: string, routeType: string, status = 500) => {
      const response = {
        status,
        headers: new Map([
          ['Content-Type', 'application/json; charset=utf-8'],
          ['Cache-Control', 'public, max-age=5, stale-while-revalidate=30'],
        ]),
        get: (key: string) => response.headers.get(key),
        json: () => Promise.resolve({ error }),
      };
      return response;
    }),
  },
}));

import { GET } from '../route';
import { prisma } from '@/lib/prisma';

describe('/api/public/appearance', () => {
  const mockAppearance = {
    id: 1,
    instanceName: 'Test Instance',
    headerText: 'Welcome to Test',
    theme: 'system',
    showClock: false,
    updatedAt: new Date('2024-01-01T12:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    const { getAppearance } = require('@/lib/config/appearance');
    getAppearance.mockResolvedValue(mockAppearance);
  });

  describe('Authentication', () => {
    it('should return 401 when no token is provided', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/public/appearance'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 when invalid token is provided', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/public/appearance',
        {
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        }
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 200 when valid token is provided', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/public/appearance',
        {
          headers: {
            Authorization: 'Bearer test-public-token',
          },
        }
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        instanceName: 'Test Instance',
        headerText: 'Welcome to Test',
        theme: 'system',
      });
    });
  });

  describe('Response Headers', () => {
    beforeEach(() => {
      // Mock valid authentication
      const request = new NextRequest(
        'http://localhost:3000/api/public/appearance',
        {
          headers: {
            Authorization: 'Bearer test-public-token',
          },
        }
      );
    });

    it('should set correct Content-Type header', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/public/appearance',
        {
          headers: {
            Authorization: 'Bearer test-public-token',
          },
        }
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe(
        'application/json; charset=utf-8'
      );
    });

    it('should set correct Cache-Control header for public caching', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/public/appearance',
        {
          headers: {
            Authorization: 'Bearer test-public-token',
          },
        }
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe(
        'public, max-age=5, stale-while-revalidate=30'
      );
    });
  });

  describe('Response Data', () => {
    it('should return appearance data with correct structure', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/public/appearance',
        {
          headers: {
            Authorization: 'Bearer test-public-token',
          },
        }
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          instanceName: 'Test Instance',
          headerText: 'Welcome to Test',
          theme: 'system',
        },
      });
    });

    it('should use env fallback when DB is missing', async () => {
      const { getAppearance } = require('@/lib/config/appearance');

      // Mock getAppearance to simulate DB fallback
      getAppearance.mockResolvedValue({
        id: 1,
        instanceName: 'Lab Portal', // Default from env
        headerText: null, // Default from env
        theme: 'system',
        showClock: false,
        updatedAt: new Date(),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/public/appearance',
        {
          headers: {
            Authorization: 'Bearer test-public-token',
          },
        }
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          instanceName: 'Lab Portal',
          headerText: null,
          theme: 'system',
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      const { getAppearance } = require('@/lib/config/appearance');
      getAppearance.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest(
        'http://localhost:3000/api/public/appearance',
        {
          headers: {
            Authorization: 'Bearer test-public-token',
          },
        }
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
    });
  });

  describe('Appearance Singleton Flow', () => {
    it('should call getAppearance and return cached data', async () => {
      const { getAppearance } = require('@/lib/config/appearance');

      const request = new NextRequest(
        'http://localhost:3000/api/public/appearance',
        {
          headers: {
            Authorization: 'Bearer test-public-token',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(getAppearance).toHaveBeenCalledTimes(1);
      expect(data.data).toEqual({
        instanceName: 'Test Instance',
        headerText: 'Welcome to Test',
        theme: 'system',
      });
    });

    it('should return only public fields (instanceName, headerText, theme)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/public/appearance',
        {
          headers: {
            Authorization: 'Bearer test-public-token',
          },
        }
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveProperty('instanceName');
      expect(data.data).toHaveProperty('headerText');
      expect(data.data).toHaveProperty('theme');

      // Should not include private fields
      expect(data.data).not.toHaveProperty('id');
      expect(data.data).not.toHaveProperty('showClock');
      expect(data.data).not.toHaveProperty('updatedAt');
    });
  });
});
