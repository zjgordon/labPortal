import { NextRequest, NextResponse } from 'next/server';
import { prismaMock } from '../../../../../tests/utils/prismaMock';

// Mock all dependencies
jest.mock('@/lib/auth/wrappers', () => ({
  withAgentAuth: (handler: any) => async (req: any) => {
    // Simulate the actual withAgentAuth behavior
    const {
      getPrincipal,
      createPrincipalError,
    } = require('@/lib/auth/principal');
    try {
      const principal = await getPrincipal(req, { require: 'agent' });
      return await handler(req, principal);
    } catch (error) {
      if (error instanceof Error) {
        return createPrincipalError(error);
      }
      return new Response('Internal server error', { status: 500 });
    }
  },
}));

jest.mock('@/lib/control/fsm', () => ({
  ActionFSM: {
    guard: jest.fn(),
  },
}));

jest.mock('@/lib/auth/principal', () => ({
  getPrincipal: jest.fn(),
  createPrincipalError: jest.fn((error: Error) => {
    const message = error.message;
    if (message.includes('cookies')) {
      return NextResponse.json(
        { error: 'cookies not allowed' },
        { status: 400 }
      );
    }
    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }),
}));

jest.mock('@/lib/errors', () => ({
  createErrorResponse: jest.fn(
    (code: string, message: string, status: number) => {
      return NextResponse.json({ error: message }, { status });
    }
  ),
  ErrorCodes: {
    NOT_FOUND: 'NOT_FOUND',
    HOST_MISMATCH: 'HOST_MISMATCH',
    INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    COOKIES_NOT_ALLOWED: 'COOKIES_NOT_ALLOWED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    UNAUTHORIZED: 'UNAUTHORIZED',
  },
}));

// Create a mock Prisma client
const mockPrisma = {
  action: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

// Mock the PrismaClient constructor
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Import the route after mocking
const { POST } = require('../route');

describe('/api/control/report', () => {
  const mockPrincipal = {
    type: 'agent' as const,
    hostId: 'test-host-1',
  };

  const mockAction = {
    id: 'action-1',
    hostId: 'test-host-1',
    status: 'running' as const,
    startedAt: new Date('2024-01-01T00:00:00Z'),
    finishedAt: null,
    exitCode: null,
    message: null,
    host: {
      id: 'test-host-1',
      name: 'Test Host',
    },
    service: {
      id: 'service-1',
      unitName: 'test.service',
      displayName: 'Test Service',
    },
  };

  const mockReportData = {
    actionId: 'action-1',
    status: 'succeeded',
    exitCode: 0,
    message: 'Action completed successfully',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset prisma mocks
    mockPrisma.action.findUnique.mockResolvedValue(mockAction);
    mockPrisma.action.update.mockResolvedValue({
      ...mockAction,
      status: 'succeeded',
      finishedAt: new Date(),
      exitCode: 0,
      message: 'Action completed successfully',
    });
  });

  describe('Cookie rejection on agent routes', () => {
    it('should return 400 "cookies not allowed" when Cookie header is present', async () => {
      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockRejectedValue(
        new Error('Agent routes cannot accept session cookies')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/control/report',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: 'session=abc123',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify(mockReportData),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toContain('cookies not allowed');
    });

    it('should return 400 "cookies not allowed" when multiple cookies are present', async () => {
      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockRejectedValue(
        new Error('Agent routes cannot accept session cookies')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/control/report',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: 'session=abc123; other=def456',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify(mockReportData),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toContain('cookies not allowed');
    });
  });

  describe('Bearer token validation', () => {
    it('should return 401 when Authorization header is missing', async () => {
      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockRejectedValue(
        new Error('Unauthorized. Valid agent token required.')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/control/report',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockReportData),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(401);

      const responseData = await response.json();
      expect(responseData.error).toContain('Unauthorized');
    });

    it('should return 401 when Authorization header is invalid', async () => {
      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockRejectedValue(
        new Error('Unauthorized. Valid agent token required.')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/control/report',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Invalid token',
          },
          body: JSON.stringify(mockReportData),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(401);

      const responseData = await response.json();
      expect(responseData.error).toContain('Unauthorized');
    });

    it('should return 401 when Bearer token is empty', async () => {
      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockRejectedValue(
        new Error('Unauthorized. Valid agent token required.')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/control/report',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ',
          },
          body: JSON.stringify(mockReportData),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(401);

      const responseData = await response.json();
      expect(responseData.error).toContain('Unauthorized');
    });

    it('should pass basic auth guard with valid Bearer token', async () => {
      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockResolvedValue(mockPrincipal);

      const request = new NextRequest(
        'http://localhost:3000/api/control/report',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify(mockReportData),
        }
      );

      const response = await POST(request);

      // Should not return 401 - the auth guard should pass
      expect(response.status).not.toBe(401);
    });
  });

  describe('Action reporting functionality', () => {
    it('should successfully report action status with valid data', async () => {
      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockResolvedValue(mockPrincipal);

      const request = new NextRequest(
        'http://localhost:3000/api/control/report',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify(mockReportData),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData).toMatchObject({
        id: 'action-1',
        hostId: 'test-host-1',
        status: 'succeeded',
        exitCode: 0,
        message: 'Action completed successfully',
      });

      // Verify that findUnique was called with correct parameters
      expect(mockPrisma.action.findUnique).toHaveBeenCalledWith({
        where: { id: 'action-1' },
        include: {
          host: true,
          service: true,
        },
      });

      // Verify that update was called
      expect(mockPrisma.action.update).toHaveBeenCalledWith({
        where: { id: 'action-1' },
        data: expect.objectContaining({
          status: 'succeeded',
          finishedAt: expect.any(Date),
          exitCode: 0,
          message: 'Action completed successfully',
        }),
        include: {
          host: {
            select: {
              id: true,
              name: true,
            },
          },
          service: {
            select: {
              id: true,
              unitName: true,
              displayName: true,
            },
          },
        },
      });

      // Verify FSM guard was called
      const { ActionFSM } = require('@/lib/control/fsm');
      expect(ActionFSM.guard).toHaveBeenCalledWith('running', 'succeeded');
    });

    it('should return 404 when action is not found', async () => {
      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockResolvedValue(mockPrincipal);
      mockPrisma.action.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/control/report',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify(mockReportData),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(404);

      const responseData = await response.json();
      expect(responseData.error).toContain('Action not found');
    });

    it('should return 403 when action does not belong to host', async () => {
      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockResolvedValue(mockPrincipal);
      const actionFromDifferentHost = {
        ...mockAction,
        hostId: 'different-host',
      };
      mockPrisma.action.findUnique.mockResolvedValue(actionFromDifferentHost);

      const request = new NextRequest(
        'http://localhost:3000/api/control/report',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify(mockReportData),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(403);

      const responseData = await response.json();
      expect(responseData.error).toContain(
        'Action does not belong to this host'
      );
    });

    it('should return 400 for invalid state transition', async () => {
      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockResolvedValue(mockPrincipal);
      const { ActionFSM } = require('@/lib/control/fsm');
      ActionFSM.guard.mockImplementation(() => {
        throw new Error('Invalid state transition');
      });

      const request = new NextRequest(
        'http://localhost:3000/api/control/report',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify(mockReportData),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toContain('Invalid state transition');
    });

    it('should return 400 for validation errors', async () => {
      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockResolvedValue(mockPrincipal);
      const invalidData = {
        actionId: '', // Invalid: empty string
        status: 'invalid-status', // Invalid: not in enum
      };

      const request = new NextRequest(
        'http://localhost:3000/api/control/report',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify(invalidData),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toContain('Validation error');
    });
  });

  describe('Error handling', () => {
    it('should return 500 for unexpected errors', async () => {
      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockResolvedValue(mockPrincipal);
      mockPrisma.action.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/control/report',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify(mockReportData),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(500);

      const responseData = await response.json();
      expect(responseData.error).toContain('Failed to report action status');
    });
  });
});
