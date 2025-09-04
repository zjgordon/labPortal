import { NextRequest, NextResponse } from 'next/server';
import { GET } from './route';
import { prismaMock } from '../../../../tests/utils/prismaMock';

// Mock the auth wrapper to bypass authentication
jest.mock('@/lib/auth/wrappers', () => ({
  withAgentAuth: (handler: any) => handler,
}));

// Mock the response helper
jest.mock('@/lib/response-helper', () => ({
  ResponseHelper: {
    noContent: jest.fn(() => {
      const response = new NextResponse(null, { status: 204 });
      response.headers.set('Connection', 'keep-alive');
      return response;
    }),
    success: jest.fn((data: any) => {
      const response = NextResponse.json(data, { status: 200 });
      response.headers.set('Connection', 'keep-alive');
      return response;
    }),
  },
}));

// Mock the FSM
jest.mock('@/lib/control/fsm', () => ({
  ActionFSM: {
    guard: jest.fn(),
  },
}));

// Mock setTimeout to avoid actual delays in tests
jest.mock('timers', () => ({
  setTimeout: jest.fn((callback: Function, delay: number) => {
    // Execute callback immediately for testing
    callback();
    return 1; // Mock timer ID
  }),
}));

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

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset prisma mocks
    (prismaMock.action.findMany as jest.Mock).mockResolvedValue([]);
    (prismaMock.action.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
    (prismaMock.$transaction as jest.Mock).mockImplementation(
      async (callback) => {
        return await callback(prismaMock);
      }
    );
  });

  describe('Case A: No actions & wait=0 -> 204 No Content', () => {
    it('should return 204 when no actions are available and wait=0', async () => {
      // Mock no actions found
      (prismaMock.action.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/control/queue?wait=0'
      );
      const response = await GET(request, mockPrincipal);

      expect(response.status).toBe(204);
      expect(response.headers.get('Connection')).toBe('keep-alive');

      // Verify that findMany was called with correct parameters
      expect(prismaMock.action.findMany).toHaveBeenCalledWith({
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
      (prismaMock.action.findMany as jest.Mock).mockResolvedValue([mockAction]);
      (prismaMock.action.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

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
        startedAt: expect.any(String), // Date will be serialized as string
      });

      // Verify that updateMany was called to lock the action
      expect(prismaMock.action.updateMany).toHaveBeenCalledWith({
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
      // Mock 2 actions found
      (prismaMock.action.findMany as jest.Mock).mockResolvedValue([
        mockAction,
        mockAction2,
      ]);
      (prismaMock.action.updateMany as jest.Mock).mockResolvedValue({
        count: 2,
      });

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
        startedAt: expect.any(String),
      });
      expect(responseData[1]).toMatchObject({
        id: 'action-2',
        status: 'running',
        startedAt: expect.any(String),
      });

      // Verify that findMany was called with max=2
      expect(prismaMock.action.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 2,
        })
      );

      // Verify that updateMany was called for both actions
      expect(prismaMock.action.updateMany).toHaveBeenCalledWith({
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
      (prismaMock.action.findMany as jest.Mock).mockResolvedValue([mockAction]);
      (prismaMock.action.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

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
      (prismaMock.action.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/control/queue?wait=1'
      );
      const response = await GET(request, mockPrincipal);

      expect(response.status).toBe(204);
      expect(response.headers.get('Connection')).toBe('keep-alive');

      // Verify that findMany was called multiple times (initial + polling attempts)
      expect(prismaMock.action.findMany).toHaveBeenCalledTimes(1); // Only once since we mock setTimeout to execute immediately
    });

    it('should return actions if they become available during polling', async () => {
      // Mock no actions initially, then action becomes available
      (prismaMock.action.findMany as jest.Mock)
        .mockResolvedValueOnce([]) // First call - no actions
        .mockResolvedValueOnce([mockAction]); // Second call - action available
      (prismaMock.action.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

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
      (prismaMock.action.findMany as jest.Mock).mockResolvedValue([mockAction]);

      const { ActionFSM } = require('@/lib/control/fsm');
      (ActionFSM.guard as jest.Mock).mockImplementation(() => {
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
      (prismaMock.action.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

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
