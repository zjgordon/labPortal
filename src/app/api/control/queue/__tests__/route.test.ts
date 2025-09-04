import { NextRequest, NextResponse } from 'next/server';

// Mock all dependencies
jest.mock('@/lib/auth/wrappers', () => ({
  withAgentAuth: (handler: any) => handler,
}));

jest.mock('@/lib/response-helper', () => ({
  ResponseHelper: {
    noContent: jest.fn(() => {
      const response = {
        status: 204,
        headers: new Map([['Connection', 'keep-alive']]),
        get: (key: string) => response.headers.get(key),
      };
      return response;
    }),
    success: jest.fn((data: any) => {
      const response = {
        status: 200,
        headers: new Map([['Connection', 'keep-alive']]),
        get: (key: string) => response.headers.get(key),
        json: () => Promise.resolve(data),
      };
      return response;
    }),
  },
}));

jest.mock('@/lib/control/fsm', () => ({
  ActionFSM: {
    guard: jest.fn(),
  },
}));

jest.mock('@/lib/errors', () => ({
  createErrorResponse: jest.fn(
    (code: string, message: string, status: number) => {
      return NextResponse.json({ error: message }, { status });
    }
  ),
  ErrorCodes: {
    INVALID_PARAMETERS: 'INVALID_PARAMETERS',
    ACTION_LOCKED: 'ACTION_LOCKED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
  },
}));

// Mock setTimeout to avoid actual delays in tests
jest.mock('timers', () => ({
  setTimeout: jest.fn((callback: Function, delay: number) => {
    callback();
    return 1;
  }),
}));

// Create a mock Prisma client
const mockPrisma = {
  action: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

// Mock the PrismaClient constructor
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Import the route after mocking
const { GET } = require('../route');

describe('/api/control/queue', () => {
  const mockPrincipal = {
    type: 'agent' as const,
    hostId: 'test-host-1',
  };

  const mockAction = {
    id: 'action-1',
    hostId: 'test-host-1',
    serviceId: 'service-1',
    kind: 'start',
    status: 'queued' as const,
    requestedBy: 'test-user',
    requestedAt: new Date('2024-01-01T00:00:00Z'),
    startedAt: null,
    finishedAt: null,
    exitCode: null,
    message: null,
    idempotencyKey: null,
    service: {
      id: 'service-1',
      unitName: 'test.service',
      displayName: 'Test Service',
      description: 'A test service',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset prisma mocks
    mockPrisma.action.findMany.mockResolvedValue([]);
    mockPrisma.action.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const txMock = {
        action: {
          findMany: mockPrisma.action.findMany,
          updateMany: mockPrisma.action.updateMany,
        },
      };
      return await callback(txMock);
    });
  });

  describe('Case A: No actions & wait=0 -> 204 No Content', () => {
    it('should return 204 when no actions are available and wait=0', async () => {
      // Mock no actions found
      mockPrisma.action.findMany.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/control/queue?wait=0'
      );
      const response = await GET(request, mockPrincipal);

      expect(response.status).toBe(204);
      expect(response.headers.get('Connection')).toBe('keep-alive');

      // Verify that findMany was called with correct parameters
      expect(mockPrisma.action.findMany).toHaveBeenCalledWith({
        where: {
          hostId: 'test-host-1',
          status: 'queued',
        },
        include: {
          service: {
            select: {
              id: true,
              unitName: true,
              displayName: true,
              description: true,
            },
          },
        },
        orderBy: {
          requestedAt: 'asc',
        },
        take: 1, // default max=1
      });
    });
  });

  describe('Case B: Action exists -> 200 with status transitioned to running', () => {
    it('should return 200 with action and transition status to running', async () => {
      // Mock action found
      mockPrisma.action.findMany.mockResolvedValue([mockAction]);
      mockPrisma.action.updateMany.mockResolvedValue({ count: 1 });

      const request = new NextRequest(
        'http://localhost:3000/api/control/queue'
      );
      const response = await GET(request, mockPrincipal);

      expect(response.status).toBe(200);
      expect(response.headers.get('Connection')).toBe('keep-alive');

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);
      expect(responseData).toHaveLength(1);

      // Verify the action was returned with updated status
      expect(responseData[0]).toMatchObject({
        id: 'action-1',
        hostId: 'test-host-1',
        status: 'running',
        startedAt: expect.any(Date), // Date object
      });

      // Verify that updateMany was called to lock the action
      expect(mockPrisma.action.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['action-1'] },
        },
        data: {
          status: 'running',
          startedAt: expect.any(Date),
        },
      });

      // Verify FSM guard was called
      const { ActionFSM } = require('@/lib/control/fsm');
      expect(ActionFSM.guard).toHaveBeenCalledWith('queued', 'running');
    });
  });

  describe('Case C: max=2 returns up to 2 items', () => {
    it('should return up to 2 actions when max=2', async () => {
      const mockAction2 = {
        ...mockAction,
        id: 'action-2',
        serviceId: 'service-2',
        service: {
          ...mockAction.service,
          id: 'service-2',
          unitName: 'test2.service',
          displayName: 'Test Service 2',
        },
      };

      // Mock 2 actions found
      mockPrisma.action.findMany.mockResolvedValue([mockAction, mockAction2]);
      mockPrisma.action.updateMany.mockResolvedValue({ count: 2 });

      const request = new NextRequest(
        'http://localhost:3000/api/control/queue?max=2'
      );
      const response = await GET(request, mockPrincipal);

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);
      expect(responseData).toHaveLength(2);

      // Verify both actions were returned with updated status
      expect(responseData[0]).toMatchObject({
        id: 'action-1',
        status: 'running',
        startedAt: expect.any(Date),
      });
      expect(responseData[1]).toMatchObject({
        id: 'action-2',
        status: 'running',
        startedAt: expect.any(Date),
      });

      // Verify that findMany was called with max=2
      expect(mockPrisma.action.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 2,
        })
      );

      // Verify that updateMany was called for both actions
      expect(mockPrisma.action.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['action-1', 'action-2'] },
        },
        data: {
          status: 'running',
          startedAt: expect.any(Date),
        },
      });
    });

    it('should return only 1 action when max=2 but only 1 is available', async () => {
      // Mock only 1 action found
      mockPrisma.action.findMany.mockResolvedValue([mockAction]);
      mockPrisma.action.updateMany.mockResolvedValue({ count: 1 });

      const request = new NextRequest(
        'http://localhost:3000/api/control/queue?max=2'
      );
      const response = await GET(request, mockPrincipal);

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);
      expect(responseData).toHaveLength(1);
      expect(responseData[0].id).toBe('action-1');
    });
  });

  describe('Case D: Long-poll with wait=1 and no actions -> 204 after ~1s', () => {
    it('should return 204 after polling when no actions are available', async () => {
      // Mock no actions found during polling
      mockPrisma.action.findMany.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/control/queue?wait=1'
      );
      const response = await GET(request, mockPrincipal);

      expect(response.status).toBe(204);
      expect(response.headers.get('Connection')).toBe('keep-alive');

      // Verify that findMany was called (initial call)
      expect(mockPrisma.action.findMany).toHaveBeenCalled();
    });

    it('should return actions if they become available during polling', async () => {
      // Mock no actions initially, then action becomes available
      mockPrisma.action.findMany
        .mockResolvedValueOnce([]) // First call - no actions
        .mockResolvedValueOnce([mockAction]); // Second call - action available
      mockPrisma.action.updateMany.mockResolvedValue({ count: 1 });

      const request = new NextRequest(
        'http://localhost:3000/api/control/queue?wait=1'
      );
      const response = await GET(request, mockPrincipal);

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);
      expect(responseData).toHaveLength(1);
      expect(responseData[0].id).toBe('action-1');
      expect(responseData[0].status).toBe('running');
    });
  });

  describe('Parameter validation', () => {
    it('should return 400 for invalid max parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/control/queue?max=0'
      );
      const response = await GET(request, mockPrincipal);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toContain(
        'Max parameter must be between 1 and 10'
      );
    });

    it('should return 400 for max parameter > 10', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/control/queue?max=11'
      );
      const response = await GET(request, mockPrincipal);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toContain(
        'Max parameter must be between 1 and 10'
      );
    });

    it('should return 400 for invalid wait parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/control/queue?wait=-1'
      );
      const response = await GET(request, mockPrincipal);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toContain(
        'Wait parameter must be between 0 and 25 seconds'
      );
    });

    it('should return 400 for wait parameter > 25', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/control/queue?wait=26'
      );
      const response = await GET(request, mockPrincipal);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toContain(
        'Wait parameter must be between 0 and 25 seconds'
      );
    });
  });

  describe('FSM validation errors', () => {
    it('should return 400 when FSM guard fails', async () => {
      // Mock action found but FSM guard fails
      mockPrisma.action.findMany.mockResolvedValue([mockAction]);

      const { ActionFSM } = require('@/lib/control/fsm');
      ActionFSM.guard.mockImplementation(() => {
        throw new Error('Invalid state transition: queued -> running');
      });

      const request = new NextRequest(
        'http://localhost:3000/api/control/queue'
      );
      const response = await GET(request, mockPrincipal);

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toContain('Action locking failed');
    });
  });

  describe('Error handling', () => {
    it('should return 500 for unexpected errors', async () => {
      // Mock database error
      mockPrisma.action.findMany.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest(
        'http://localhost:3000/api/control/queue'
      );
      const response = await GET(request, mockPrincipal);

      expect(response.status).toBe(500);

      const responseData = await response.json();
      expect(responseData.error).toContain('Failed to fetch agent queue');
    });
  });
});
