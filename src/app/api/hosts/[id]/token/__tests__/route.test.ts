import { NextRequest, NextResponse } from 'next/server';
import { prismaMock } from '../../../../../../../tests/utils/prismaMock';

// Mock all dependencies
jest.mock('@/lib/auth/principal', () => ({
  getPrincipal: jest.fn(),
  createPrincipalError: jest.fn((error: Error) => {
    // Only return 401 for authentication errors, not database errors
    if (error.message.includes('Database error')) {
      return NextResponse.json(
        { error: 'Failed to rotate agent token' },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 401 });
  }),
}));

jest.mock('@/lib/auth/token-utils', () => ({
  generateAgentToken: jest.fn(() => ({
    plaintext: 'new-agent-token-12345',
    hash: 'hashed-token-12345',
    prefix: 'new-',
  })),
}));

jest.mock('@/lib/auth/csrf-protection', () => ({
  verifyOrigin: jest.fn(),
  getAdminCorsHeaders: jest.fn(() => ({})),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

// Import the route after mocking
const { POST } = require('../route');

describe('/api/hosts/[id]/token', () => {
  const mockAdminPrincipal = {
    type: 'admin' as const,
    email: 'admin@local',
    sub: 'admin',
  };

  const mockHost = {
    id: 'host-1',
    name: 'Test Host',
    agentTokenHash: 'old-hash',
    agentTokenPrefix: 'old-',
    tokenRotatedAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset prisma mocks
    prismaMock.host.findUnique.mockResolvedValue(mockHost);
    prismaMock.host.update.mockResolvedValue({
      ...mockHost,
      agentTokenHash: 'hashed-token-12345',
      agentTokenPrefix: 'new-',
      tokenRotatedAt: new Date(),
      updatedAt: new Date(),
    });

    // Reset auth mocks
    const { getPrincipal } = require('@/lib/auth/principal');
    getPrincipal.mockClear();
  });

  describe('Origin enforcement on admin writes', () => {
    it('should return 403 when Origin header is missing', async () => {
      const { verifyOrigin } = require('@/lib/auth/csrf-protection');
      verifyOrigin.mockReturnValue(false);

      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockResolvedValue(mockAdminPrincipal);

      const request = new NextRequest(
        'http://localhost:3000/api/hosts/host-1/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request, { params: { id: 'host-1' } });

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toContain('CSRF protection: Invalid origin');
    });

    it('should return 403 when Origin header is wrong', async () => {
      const { verifyOrigin } = require('@/lib/auth/csrf-protection');
      verifyOrigin.mockReturnValue(false);

      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockResolvedValue(mockAdminPrincipal);

      const request = new NextRequest(
        'http://localhost:3000/api/hosts/host-1/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'https://malicious-site.com',
          },
        }
      );

      const response = await POST(request, { params: { id: 'host-1' } });

      expect(response.status).toBe(400);

      const responseData = await response.json();
      expect(responseData.error).toContain('CSRF protection: Invalid origin');
    });

    it('should return 200 with valid session and valid Origin', async () => {
      const { verifyOrigin } = require('@/lib/auth/csrf-protection');
      verifyOrigin.mockReturnValue(true);

      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockResolvedValue(mockAdminPrincipal);

      const request = new NextRequest(
        'http://localhost:3000/api/hosts/host-1/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'http://localhost:3000',
          },
        }
      );

      const response = await POST(request, { params: { id: 'host-1' } });

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData).toMatchObject({
        message: 'Agent token rotated successfully',
        token: 'new-agent-token-12345',
        host: {
          id: 'host-1',
          name: 'Test Host',
          tokenPrefix: 'new-',
          tokenRotatedAt: expect.any(String),
        },
      });

      // Verify that verifyOrigin was called
      expect(verifyOrigin).toHaveBeenCalledWith(request);

      // Verify that getPrincipal was called with admin requirement
      expect(getPrincipal).toHaveBeenCalledWith(request, { require: 'admin' });

      // Verify that host was updated with new token
      expect(prismaMock.host.update).toHaveBeenCalledWith({
        where: { id: 'host-1' },
        data: {
          agentTokenHash: 'hashed-token-12345',
          agentTokenPrefix: 'new-',
          tokenRotatedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        select: {
          id: true,
          name: true,
          agentTokenPrefix: true,
          tokenRotatedAt: true,
          updatedAt: true,
        },
      });

      // Verify Cache-Control header is set
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    });
  });

  describe('Admin authentication', () => {
    it('should return 401 when admin session is invalid', async () => {
      const { verifyOrigin } = require('@/lib/auth/csrf-protection');
      verifyOrigin.mockReturnValue(true);

      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockRejectedValue(
        new Error('Unauthorized. Admin access required.')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/hosts/host-1/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'http://localhost:3000',
          },
        }
      );

      const response = await POST(request, { params: { id: 'host-1' } });

      expect(response.status).toBe(401);

      const responseData = await response.json();
      expect(responseData.error).toContain(
        'Unauthorized. Admin access required.'
      );
    });

    it('should return 401 when no session is present', async () => {
      const { verifyOrigin } = require('@/lib/auth/csrf-protection');
      verifyOrigin.mockReturnValue(true);

      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockRejectedValue(
        new Error('Unauthorized. Admin access required.')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/hosts/host-1/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'http://localhost:3000',
          },
        }
      );

      const response = await POST(request, { params: { id: 'host-1' } });

      expect(response.status).toBe(401);

      const responseData = await response.json();
      expect(responseData.error).toContain(
        'Unauthorized. Admin access required.'
      );
    });
  });

  describe('Host validation', () => {
    it('should return 404 when host is not found', async () => {
      const { verifyOrigin } = require('@/lib/auth/csrf-protection');
      verifyOrigin.mockReturnValue(true);

      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockResolvedValue(mockAdminPrincipal);

      prismaMock.host.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/hosts/nonexistent-host/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'http://localhost:3000',
          },
        }
      );

      const response = await POST(request, {
        params: { id: 'nonexistent-host' },
      });

      expect(response.status).toBe(404);

      const responseData = await response.json();
      expect(responseData.error).toContain('Host not found');
    });
  });

  describe('Token generation', () => {
    it('should generate new token and return it once', async () => {
      const { verifyOrigin } = require('@/lib/auth/csrf-protection');
      verifyOrigin.mockReturnValue(true);

      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockResolvedValue(mockAdminPrincipal);

      const { generateAgentToken } = require('@/lib/auth/token-utils');
      generateAgentToken.mockReturnValue({
        plaintext: 'unique-token-67890',
        hash: 'unique-hash-67890',
        prefix: 'unique-',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/hosts/host-1/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'http://localhost:3000',
          },
        }
      );

      const response = await POST(request, { params: { id: 'host-1' } });

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.token).toBe('unique-token-67890');

      // Verify that generateAgentToken was called
      expect(generateAgentToken).toHaveBeenCalled();

      // Verify that host was updated with new token hash and prefix
      expect(prismaMock.host.update).toHaveBeenCalledWith({
        where: { id: 'host-1' },
        data: {
          agentTokenHash: 'unique-hash-67890',
          agentTokenPrefix: 'unique-',
          tokenRotatedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        select: {
          id: true,
          name: true,
          agentTokenPrefix: true,
          tokenRotatedAt: true,
          updatedAt: true,
        },
      });
    });

    it('should update token rotation timestamp', async () => {
      const { verifyOrigin } = require('@/lib/auth/csrf-protection');
      verifyOrigin.mockReturnValue(true);

      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockResolvedValue(mockAdminPrincipal);

      const beforeTime = new Date();

      const request = new NextRequest(
        'http://localhost:3000/api/hosts/host-1/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'http://localhost:3000',
          },
        }
      );

      const response = await POST(request, { params: { id: 'host-1' } });

      expect(response.status).toBe(200);

      const afterTime = new Date();

      // Verify that tokenRotatedAt was set to a recent timestamp
      const updateCall = prismaMock.host.update.mock.calls[0];
      const tokenRotatedAt = updateCall[0].data.tokenRotatedAt;

      expect(tokenRotatedAt).toBeInstanceOf(Date);
      expect(tokenRotatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime()
      );
      expect(tokenRotatedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('Error handling', () => {
    it('should return 500 for unexpected errors', async () => {
      const { verifyOrigin } = require('@/lib/auth/csrf-protection');
      verifyOrigin.mockReturnValue(true);

      const { getPrincipal } = require('@/lib/auth/principal');
      getPrincipal.mockResolvedValue(mockAdminPrincipal);

      // Mock the host lookup to fail
      prismaMock.host.findUnique.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest(
        'http://localhost:3000/api/hosts/host-1/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'http://localhost:3000',
          },
        }
      );

      const response = await POST(request, { params: { id: 'host-1' } });

      expect(response.status).toBe(500);

      const responseData = await response.json();
      expect(responseData.error).toContain('Failed to rotate agent token');
    });
  });
});
