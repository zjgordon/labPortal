import { NextRequest } from 'next/server';

// Mock the singleton prisma instance first
jest.mock('@/lib/prisma', () => ({
  prisma: {
    appearance: {
      upsert: jest.fn(),
    },
  },
}));

// Mock all dependencies
jest.mock('@/lib/auth', () => ({
  requireAdminAuth: jest.fn(),
}));

jest.mock('@/lib/auth/admin-auth', () => ({
  validateAdminOrigin: jest.fn(),
}));

jest.mock('@/lib/response-helper', () => ({
  ResponseHelper: {
    success: jest.fn((data: any, routeType: string, status = 200) => {
      const response = {
        status,
        headers: new Map([
          ['Content-Type', 'application/json; charset=utf-8'],
          [
            'Cache-Control',
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          ],
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
          [
            'Cache-Control',
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          ],
        ]),
        get: (key: string) => response.headers.get(key),
        json: () => Promise.resolve({ error }),
      };
      return response;
    }),
  },
}));

jest.mock('@/lib/config/appearance', () => ({
  getAppearance: jest.fn(),
}));

import { GET, PUT } from '../route';
import { prisma } from '@/lib/prisma';

describe('/api/admin/appearance', () => {
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
    const { requireAdminAuth } = require('@/lib/auth');
    const { validateAdminOrigin } = require('@/lib/auth/admin-auth');
    const { getAppearance } = require('@/lib/config/appearance');

    requireAdminAuth.mockResolvedValue(null); // No auth error
    validateAdminOrigin.mockReturnValue({ isValid: true });
    getAppearance.mockResolvedValue({
      instanceName: 'Test Instance',
      headerText: 'Welcome to Test',
      theme: 'system',
    });
  });

  describe('GET /api/admin/appearance', () => {
    it('should return appearance data with correct headers', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/appearance'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe(
        'application/json; charset=utf-8'
      );
      expect(response.headers.get('Cache-Control')).toBe(
        'no-store, no-cache, must-revalidate, proxy-revalidate'
      );
    });

    it('should return 401 when admin authentication fails', async () => {
      const { requireAdminAuth } = require('@/lib/auth');
      requireAdminAuth.mockResolvedValue({
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/appearance'
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should handle internal errors', async () => {
      const { getAppearance } = require('@/lib/config/appearance');
      getAppearance.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest(
        'http://localhost:3000/api/admin/appearance'
      );
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/admin/appearance', () => {
    const validUpdateData = {
      instanceName: 'Updated Instance',
      headerText: 'Updated Header',
      theme: 'dark',
    };

    beforeEach(() => {
      (prisma.appearance.upsert as jest.Mock).mockResolvedValue({
        ...mockAppearance,
        ...validUpdateData,
        updatedAt: new Date(),
      });
    });

    it('should update appearance with correct headers', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/appearance',
        {
          method: 'PUT',
          body: JSON.stringify(validUpdateData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe(
        'application/json; charset=utf-8'
      );
      expect(response.headers.get('Cache-Control')).toBe(
        'no-store, no-cache, must-revalidate, proxy-revalidate'
      );
    });

    it('should return 401 when admin authentication fails', async () => {
      const { requireAdminAuth } = require('@/lib/auth');
      requireAdminAuth.mockResolvedValue({
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/appearance',
        {
          method: 'PUT',
          body: JSON.stringify(validUpdateData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request);

      expect(response.status).toBe(401);
    });

    it('should return 403 when origin validation fails', async () => {
      const { validateAdminOrigin } = require('@/lib/auth/admin-auth');
      validateAdminOrigin.mockReturnValue({ isValid: false });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/appearance',
        {
          method: 'PUT',
          body: JSON.stringify(validUpdateData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request);

      expect(response.status).toBe(403);
    });

    describe('Zod Validation', () => {
      it('should return 400 with standardized error format for missing instanceName', async () => {
        const invalidData = {
          headerText: 'Test Header',
          theme: 'light',
        };

        const request = new NextRequest(
          'http://localhost:3000/api/admin/appearance',
          {
            method: 'PUT',
            body: JSON.stringify(invalidData),
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({ error: 'Validation failed' });
      });

      it('should return 400 with standardized error format for too-long headerText', async () => {
        const invalidData = {
          instanceName: 'Valid Instance',
          headerText: 'A'.repeat(141), // Exceeds max length of 140
          theme: 'light',
        };

        const request = new NextRequest(
          'http://localhost:3000/api/admin/appearance',
          {
            method: 'PUT',
            body: JSON.stringify(invalidData),
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({ error: 'Validation failed' });
      });

      it('should return 400 with standardized error format for invalid theme', async () => {
        const invalidData = {
          instanceName: 'Valid Instance',
          headerText: 'Valid Header',
          theme: 'invalid-theme',
        };

        const request = new NextRequest(
          'http://localhost:3000/api/admin/appearance',
          {
            method: 'PUT',
            body: JSON.stringify(invalidData),
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({ error: 'Validation failed' });
      });

      it('should return 400 with standardized error format for too-long instanceName', async () => {
        const invalidData = {
          instanceName: 'A'.repeat(61), // Exceeds max length of 60
          headerText: 'Valid Header',
          theme: 'light',
        };

        const request = new NextRequest(
          'http://localhost:3000/api/admin/appearance',
          {
            method: 'PUT',
            body: JSON.stringify(invalidData),
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({ error: 'Validation failed' });
      });
    });

    it('should handle database errors', async () => {
      (prisma.appearance.upsert as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/admin/appearance',
        {
          method: 'PUT',
          body: JSON.stringify(validUpdateData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
    });

    it('should successfully update appearance with valid data', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/appearance',
        {
          method: 'PUT',
          body: JSON.stringify(validUpdateData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          id: 1,
          instanceName: 'Updated Instance',
          headerText: 'Updated Header',
          theme: 'dark',
          showClock: false,
          updatedAt: expect.any(Date),
        },
      });

      expect(prisma.appearance.upsert).toHaveBeenCalledWith({
        where: { id: 1 },
        update: {
          instanceName: 'Updated Instance',
          headerText: 'Updated Header',
          theme: 'dark',
          updatedAt: expect.any(Date),
        },
        create: {
          id: 1,
          instanceName: 'Updated Instance',
          headerText: 'Updated Header',
          theme: 'dark',
          showClock: false,
        },
      });
    });

    it('should update instanceName and headerText and return updated object', async () => {
      const updateData = {
        instanceName: 'New Instance Name',
        headerText: 'New Header Text',
        theme: 'light',
      };

      (prisma.appearance.upsert as jest.Mock).mockResolvedValue({
        id: 1,
        instanceName: 'New Instance Name',
        headerText: 'New Header Text',
        theme: 'light',
        showClock: false,
        updatedAt: new Date('2024-01-01T12:00:00Z'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/appearance',
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.instanceName).toBe('New Instance Name');
      expect(data.data.headerText).toBe('New Header Text');
      expect(data.data.theme).toBe('light');
      expect(data.data.id).toBe(1);
      expect(data.data.updatedAt).toBeDefined();
    });

    it('should return 400 and error code for invalid data', async () => {
      const invalidData = {
        instanceName: '', // Empty string should fail validation
        headerText: 'Valid Header',
        theme: 'light',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/appearance',
        {
          method: 'PUT',
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Validation failed' });
    });
  });
});
