// Mock Prisma first
jest.mock('@/lib/prisma', () => ({
  prisma: {
    card: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    cardStatus: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('Prisma Mock Demo', () => {
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow setting mock return values for card.findMany without type errors', async () => {
    const mockCards = [
      {
        id: 'test-card-1',
        title: 'Test Card',
        description: 'Test Description',
        url: 'http://localhost:8080',
        iconPath: null,
        order: 0,
        isEnabled: true,
        group: 'General',
        createdAt: new Date(),
        updatedAt: new Date(),
        healthPath: null,
      },
    ];

    // This should work without type errors
    mockPrisma.card.findMany.mockResolvedValue(mockCards);

    const result = await mockPrisma.card.findMany();

    expect(result).toEqual(mockCards);
    expect(mockPrisma.card.findMany).toHaveBeenCalledTimes(1);
  });

  it('should allow setting mock return values for cardStatus.upsert without type errors', async () => {
    const mockStatus = {
      id: 'test-status-1',
      cardId: 'test-card-1',
      isUp: true,
      lastChecked: new Date(),
      lastHttp: 200,
      latencyMs: 100,
      message: 'OK',
      failCount: 0,
      nextCheckAt: null,
    };

    // This should work without type errors
    mockPrisma.cardStatus.upsert.mockResolvedValue(mockStatus);

    const result = await mockPrisma.cardStatus.upsert({
      where: { cardId: 'test-card-1' },
      update: { isUp: true },
      create: { cardId: 'test-card-1', isUp: true },
    });

    expect(result).toEqual(mockStatus);
    expect(mockPrisma.cardStatus.upsert).toHaveBeenCalledWith({
      where: { cardId: 'test-card-1' },
      update: { isUp: true },
      create: { cardId: 'test-card-1', isUp: true },
    });
  });
});
