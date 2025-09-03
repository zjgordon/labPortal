import { NextRequest } from 'next/server'
import { GET } from '../status/route'
import { prisma } from '@/lib/prisma'
import { probeUrl } from '@/lib/status/probe'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    card: {
      findUnique: jest.fn(),
    },
    cardStatus: {
      upsert: jest.fn(),
    },
  },
}))

// Mock probe function
jest.mock('@/lib/probe', () => ({
  probeUrl: jest.fn(),
}))

// Mock validation
jest.mock('@/lib/validation', () => ({
  statusQuerySchema: {
    parse: jest.fn(),
  },
}))

describe('/api/status', () => {
  const mockPrisma = prisma as jest.Mocked<typeof prisma>
  const mockProbeUrl = probeUrl as jest.MockedFunction<typeof probeUrl>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/status', () => {
    const mockCard = {
      id: 'test-card-1',
      title: 'Test Tool',
      description: 'Test description',
      url: 'http://localhost:8080',
      iconPath: '/icons/test.svg',
      order: 1,
      isEnabled: true,
      group: 'Development',
      status: {
        isUp: true,
        lastChecked: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        lastHttp: 200,
        latencyMs: 150,
        message: 'OK',
        failCount: 0,
        nextCheckAt: null,
      },
    }

    const mockProbeResult = {
      isUp: true,
      lastHttp: 200,
      latencyMs: 120,
      message: 'OK',
    }

    it('returns cached status when within 30 second window', async () => {
      const { statusQuerySchema } = require('@/lib/validation')
      statusQuerySchema.parse.mockReturnValue({ cardId: 'test-card-1' })

      const recentStatus = {
        ...mockCard.status,
        lastChecked: new Date().toISOString(), // Just now
      }

      mockPrisma.card.findUnique.mockResolvedValue({
        ...mockCard,
        status: recentStatus,
      })

      const request = new NextRequest('http://localhost:3000/api/status?cardId=test-card-1')
      const response = await GET(request)
      const data = await response.json()

      expect(mockPrisma.card.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-card-1' },
        include: { status: true },
      })

      // The cache logic should work now with the fixed date comparison
      expect(mockProbeUrl).not.toHaveBeenCalled()
      expect(response.status).toBe(200)
      expect(data).toEqual(recentStatus)
    })

    it('returns cached status when nextCheckAt is in the future', async () => {
      const { statusQuerySchema } = require('@/lib/validation')
      statusQuerySchema.parse.mockReturnValue({ cardId: 'test-card-1' })

      const futureStatus = {
        ...mockCard.status,
        nextCheckAt: new Date(Date.now() + 60000).toISOString(), // 1 minute in future
      }

      mockPrisma.card.findUnique.mockResolvedValue({
        ...mockCard,
        status: futureStatus,
      })

      const request = new NextRequest('http://localhost:3000/api/status?cardId=test-card-1')
      const response = await GET(request)
      const data = await response.json()

      expect(mockProbeUrl).not.toHaveBeenCalled()
      expect(response.status).toBe(200)
      expect(data).toEqual(futureStatus)
    })

    it('probes URL when cache is stale and updates status', async () => {
      const { statusQuerySchema } = require('@/lib/validation')
      statusQuerySchema.parse.mockReturnValue({ cardId: 'test-card-1' })

      const oldStatus = {
        ...mockCard.status,
        lastChecked: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
        failCount: 1,
      }

      mockPrisma.card.findUnique.mockResolvedValue({
        ...mockCard,
        status: oldStatus,
      })

      mockProbeUrl.mockResolvedValue(mockProbeResult)

      const updatedStatus = {
        isUp: true,
        lastChecked: expect.any(String),
        lastHttp: 200,
        latencyMs: 120,
        message: 'OK',
        failCount: 0, // Reset on success
        nextCheckAt: null,
      }

      mockPrisma.cardStatus.upsert.mockResolvedValue(updatedStatus)

      const request = new NextRequest('http://localhost:3000/api/status?cardId=test-card-1')
      const response = await GET(request)
      const data = await response.json()

      expect(mockProbeUrl).toHaveBeenCalledWith('http://localhost:8080', undefined, 3000)
      // Check that upsert was called with the right structure, but ignore exact dates
      const upsertCall = mockPrisma.cardStatus.upsert.mock.calls[0][0]
      expect(upsertCall.where).toEqual({ cardId: 'test-card-1' })
      expect(upsertCall.update.isUp).toBe(true)
      expect(upsertCall.update.lastHttp).toBe(200)
      expect(upsertCall.update.latencyMs).toBe(120)
      expect(upsertCall.update.message).toBe('OK')
      expect(upsertCall.update.failCount).toBe(0)
      expect(upsertCall.update.nextCheckAt).toBe(null)
      expect(upsertCall.create.cardId).toBe('test-card-1')
      expect(upsertCall.create.isUp).toBe(true)
      expect(upsertCall.create.lastHttp).toBe(200)
      expect(upsertCall.create.latencyMs).toBe(120)
      expect(upsertCall.create.message).toBe('OK')
      expect(upsertCall.create.failCount).toBe(0)
      expect(upsertCall.create.nextCheckAt).toBe(null)

      expect(response.status).toBe(200)
      // Check response data structure, but ignore exact dates
      expect(data.isUp).toBe(true)
      expect(data.lastHttp).toBe(200)
      expect(data.latencyMs).toBe(120)
      expect(data.message).toBe('OK')
      expect(data.failCount).toBe(0)
      expect(data.nextCheckAt).toBe(null)
      expect(data.lastChecked).toBeDefined()
    })

    it('increments failCount and sets nextCheckAt when service is down', async () => {
      const { statusQuerySchema } = require('@/lib/validation')
      statusQuerySchema.parse.mockReturnValue({ cardId: 'test-card-1' })

      const oldStatus = {
        ...mockCard.status,
        lastChecked: new Date(Date.now() - 180000).toISOString(),
        failCount: 2,
      }

      mockPrisma.card.findUnique.mockResolvedValue({
        ...mockCard,
        status: oldStatus,
      })

      const downProbeResult = {
        isUp: false,
        lastHttp: 500,
        latencyMs: null,
        message: 'Internal Server Error',
      }

      mockProbeUrl.mockResolvedValue(downProbeResult)

      const updatedStatus = {
        isUp: false,
        lastChecked: expect.any(String),
        lastHttp: 500,
        latencyMs: null,
        message: 'Internal Server Error',
        failCount: 3, // Incremented
        nextCheckAt: expect.any(String), // Set to 60 seconds from now
      }

      mockPrisma.cardStatus.upsert.mockResolvedValue(updatedStatus)

      const request = new NextRequest('http://localhost:3000/api/status?cardId=test-card-1')
      const response = await GET(request)
      const data = await response.json()

      expect(mockProbeUrl).toHaveBeenCalledWith('http://localhost:8080', undefined, 3000)
      // Check that upsert was called with the right structure, but ignore exact dates
      const upsertCall = mockPrisma.cardStatus.upsert.mock.calls[0][0]
      expect(upsertCall.where).toEqual({ cardId: 'test-card-1' })
      expect(upsertCall.update.isUp).toBe(false)
      expect(upsertCall.update.lastHttp).toBe(500)
      expect(upsertCall.update.latencyMs).toBe(null)
      expect(upsertCall.update.message).toBe('Internal Server Error')
      expect(upsertCall.update.failCount).toBe(3)
      expect(upsertCall.update.nextCheckAt).toBeDefined()
      expect(upsertCall.create.cardId).toBe('test-card-1')
      expect(upsertCall.create.isUp).toBe(false)
      expect(upsertCall.create.lastHttp).toBe(500)
      expect(upsertCall.create.latencyMs).toBe(null)
      expect(upsertCall.create.message).toBe('Internal Server Error')
      expect(upsertCall.create.failCount).toBe(3)
      expect(upsertCall.create.nextCheckAt).toBeDefined()

      expect(response.status).toBe(200)
      expect(data.failCount).toBe(3)
      expect(data.nextCheckAt).toBeDefined()
    })

    it('handles cards without existing status', async () => {
      const { statusQuerySchema } = require('@/lib/validation')
      statusQuerySchema.parse.mockReturnValue({ cardId: 'test-card-1' })

      mockPrisma.card.findUnique.mockResolvedValue({
        ...mockCard,
        status: null,
      })

      mockProbeUrl.mockResolvedValue(mockProbeResult)

      const newStatus = {
        isUp: true,
        lastChecked: expect.any(String),
        lastHttp: 200,
        latencyMs: 120,
        message: 'OK',
        failCount: 0,
        nextCheckAt: null,
      }

      mockPrisma.cardStatus.upsert.mockResolvedValue(newStatus)

      const request = new NextRequest('http://localhost:3000/api/status?cardId=test-card-1')
      const response = await GET(request)
      const data = await response.json()

      expect(mockProbeUrl).toHaveBeenCalled()
      // Check that upsert was called with the right structure, but ignore exact dates
      const upsertCall = mockPrisma.cardStatus.upsert.mock.calls[0][0]
      expect(upsertCall.where).toEqual({ cardId: 'test-card-1' })
      expect(upsertCall.update.isUp).toBe(true)
      expect(upsertCall.update.lastHttp).toBe(200)
      expect(upsertCall.update.latencyMs).toBe(120)
      expect(upsertCall.update.message).toBe('OK')
      expect(upsertCall.update.failCount).toBe(0)
      expect(upsertCall.update.nextCheckAt).toBe(null)
      expect(upsertCall.create.cardId).toBe('test-card-1')
      expect(upsertCall.create.isUp).toBe(true)
      expect(upsertCall.create.lastHttp).toBe(200)
      expect(upsertCall.create.latencyMs).toBe(120)
      expect(upsertCall.create.message).toBe('OK')
      expect(upsertCall.create.failCount).toBe(0)
      expect(upsertCall.create.nextCheckAt).toBe(null)

      expect(response.status).toBe(200)
      // Check response data structure, but ignore exact dates
      expect(data.isUp).toBe(true)
      expect(data.lastHttp).toBe(200)
      expect(data.latencyMs).toBe(120)
      expect(data.message).toBe('OK')
      expect(data.failCount).toBe(0)
      expect(data.nextCheckAt).toBe(null)
      expect(data.lastChecked).toBeDefined()
    })

    it('handles cards with healthPath', async () => {
      const { statusQuerySchema } = require('@/lib/validation')
      statusQuerySchema.parse.mockReturnValue({ cardId: 'test-card-1' })

      const cardWithHealthPath = {
        ...mockCard,
        healthPath: '/health',
        status: null,
      }

      mockPrisma.card.findUnique.mockResolvedValue(cardWithHealthPath)
      mockProbeUrl.mockResolvedValue(mockProbeResult)

      const request = new NextRequest('http://localhost:3000/api/status?cardId=test-card-1')
      await GET(request)

      expect(mockProbeUrl).toHaveBeenCalledWith('http://localhost:8080', '/health', 3000)
    })

    it('returns 404 when card is not found', async () => {
      const { statusQuerySchema } = require('@/lib/validation')
      statusQuerySchema.parse.mockReturnValue({ cardId: 'nonexistent' })

      mockPrisma.card.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/status?cardId=nonexistent')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Card not found' })
    })

    it('returns 400 when card is disabled', async () => {
      const { statusQuerySchema } = require('@/lib/validation')
      statusQuerySchema.parse.mockReturnValue({ cardId: 'test-card-1' })

      const disabledCard = {
        ...mockCard,
        isEnabled: false,
      }

      mockPrisma.card.findUnique.mockResolvedValue(disabledCard)

      const request = new NextRequest('http://localhost:3000/api/status?cardId=test-card-1')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Card is disabled' })
    })

    it('handles validation errors', async () => {
      const { statusQuerySchema } = require('@/lib/validation')
      const validationError = new Error('Invalid cardId')
      validationError.name = 'ZodError'
      statusQuerySchema.parse.mockImplementation(() => {
        throw validationError
      })

      const request = new NextRequest('http://localhost:3000/api/status?cardId=invalid')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid query parameters', details: 'Invalid cardId' })
    })

    it('handles probe errors gracefully', async () => {
      const { statusQuerySchema } = require('@/lib/validation')
      statusQuerySchema.parse.mockReturnValue({ cardId: 'test-card-1' })

      mockPrisma.card.findUnique.mockResolvedValue({
        ...mockCard,
        status: null,
      })

      mockProbeUrl.mockRejectedValue(new Error('Network timeout'))

      const errorStatus = {
        isUp: false,
        lastChecked: expect.any(String),
        lastHttp: null,
        latencyMs: null,
        message: 'Network timeout',
        failCount: 1,
        nextCheckAt: expect.any(String),
      }

      mockPrisma.cardStatus.upsert.mockResolvedValue(errorStatus)

      const request = new NextRequest('http://localhost:3000/api/status?cardId=test-card-1')
      const response = await GET(request)
      const data = await response.json()

      expect(mockProbeUrl).toHaveBeenCalled()
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to check card status')
    })

    it('handles database errors gracefully', async () => {
      const { statusQuerySchema } = require('@/lib/validation')
      statusQuerySchema.parse.mockReturnValue({ cardId: 'test-card-1' })

      mockPrisma.card.findUnique.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/status?cardId=test-card-1')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to check card status' })
    })
  })
})
