import { NextRequest } from 'next/server'
import { GET, POST } from '../cards/route'

// Mock Prisma first
jest.mock('@/lib/prisma', () => ({
  prisma: {
    card: {
      findMany: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}))

// Mock validation
jest.mock('@/lib/validation', () => ({
  createCardSchema: {
    parse: jest.fn(),
  },
}))

// Mock data
const mockCards = [
  {
    id: 'card-1',
    title: 'Test Card 1',
    description: 'Test Description 1',
    url: 'http://localhost:8080',
    iconPath: '/icons/test1.svg',
    order: 1,
    isEnabled: true,
    group: 'Development',
    status: {
      isUp: true,
      lastChecked: new Date().toISOString(),
      lastHttp: 200,
      latencyMs: 150,
      message: 'OK',
      failCount: 0,
      nextCheckAt: null,
    },
  },
  {
    id: 'card-2',
    title: 'Test Card 2',
    description: 'Test Description 2',
    url: 'http://localhost:8081',
    iconPath: '/icons/test2.svg',
    order: 2,
    isEnabled: true,
    group: 'Development',
    status: {
      isUp: false,
      lastChecked: new Date().toISOString(),
      lastHttp: 500,
      latencyMs: null,
      message: 'Error',
      failCount: 1,
      nextCheckAt: null,
    },
  },
]

describe('/api/cards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/cards', () => {
    it('returns enabled cards ordered by group and order', async () => {
      const { prisma } = require('@/lib/prisma')
      prisma.card.findMany.mockResolvedValue(mockCards)

      const response = await GET()
      const data = await response.json()

      expect(prisma.card.findMany).toHaveBeenCalledWith({
        where: { isEnabled: true },
        orderBy: [
          { group: 'asc' },
          { order: 'asc' },
        ],
        include: {
          status: true,
        },
      })
      expect(response.status).toBe(200)
      expect(data).toEqual(mockCards)
    })

    it('handles database errors gracefully', async () => {
      const { prisma } = require('@/lib/prisma')
      const error = new Error('Database connection failed')
      prisma.card.findMany.mockRejectedValue(error)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch cards' })
    })
  })

  describe('POST /api/cards', () => {
    const validCardData = {
      title: 'New Test Card',
      description: 'New Test Description',
      url: 'http://localhost:8082',
      iconPath: '/icons/new-test.svg',
      group: 'Testing',
    }

    it('creates a new card successfully', async () => {
      const { prisma } = require('@/lib/prisma')
      const { createCardSchema } = require('@/lib/validation')
      
      createCardSchema.parse.mockReturnValue(validCardData)
      const newCard = { ...validCardData, id: 'new-card-id', order: 3, isEnabled: true, status: null }
      prisma.card.aggregate.mockResolvedValue({ _max: { order: 2 } })
      prisma.card.create.mockResolvedValue(newCard)

      const request = new NextRequest('http://localhost:3000/api/cards', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify(validCardData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(createCardSchema.parse).toHaveBeenCalledWith(validCardData)
      expect(prisma.card.aggregate).toHaveBeenCalledWith({
        _max: { order: true },
      })
      expect(prisma.card.create).toHaveBeenCalledWith({
        data: {
          ...validCardData,
          order: 3,
        },
        include: {
          status: true,
        },
      })
      expect(response.status).toBe(201)
      expect(data).toEqual(newCard)
    })

    it('rejects requests without authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/cards', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(validCardData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('rejects requests with invalid authorization format', async () => {
      const request = new NextRequest('http://localhost:3000/api/cards', {
        method: 'POST',
        headers: {
          'authorization': 'InvalidFormat',
          'content-type': 'application/json',
        },
        body: JSON.stringify(validCardData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('handles validation errors', async () => {
      const { createCardSchema } = require('@/lib/validation')
      const validationError = new Error('Validation failed')
      validationError.name = 'ZodError'
      createCardSchema.parse.mockImplementation(() => {
        throw validationError
      })

      const request = new NextRequest('http://localhost:3000/api/cards', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ invalid: 'data' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Validation failed',
        details: 'Validation failed',
      })
    })

    it('handles database errors during creation', async () => {
      const { prisma } = require('@/lib/prisma')
      const { createCardSchema } = require('@/lib/validation')
      
      createCardSchema.parse.mockReturnValue(validCardData)
      prisma.card.aggregate.mockResolvedValue({ _max: { order: 5 } })
      prisma.card.create.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/cards', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify(validCardData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to create card' })
    })

    it('calculates correct order for new group', async () => {
      const { prisma } = require('@/lib/prisma')
      const { createCardSchema } = require('@/lib/validation')
      
      createCardSchema.parse.mockReturnValue(validCardData)
      prisma.card.aggregate.mockResolvedValue({ _max: { order: null } })
      const newCard = { ...validCardData, id: 'new-card-id', order: 1, isEnabled: true, status: null }
      prisma.card.create.mockResolvedValue(newCard)

      const request = new NextRequest('http://localhost:3000/api/cards', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify(validCardData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(prisma.card.create).toHaveBeenCalledWith({
        data: {
          ...validCardData,
          order: 1,
        },
        include: {
          status: true,
        },
      })
      expect(response.status).toBe(201)
      expect(data).toEqual(newCard)
    })
  })
})
