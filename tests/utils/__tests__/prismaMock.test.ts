import { prismaMock } from '../prismaMock';

// Mock the prisma module
jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

describe('prismaMock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow setting mock return values for card.findMany', async () => {
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

    prismaMock.card.findMany.mockResolvedValue(mockCards);

    const result = await prismaMock.card.findMany();

    expect(result).toEqual(mockCards);
    expect(prismaMock.card.findMany).toHaveBeenCalledTimes(1);
  });

  it('should allow setting mock return values for cardStatus.upsert', async () => {
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

    prismaMock.cardStatus.upsert.mockResolvedValue(mockStatus);

    const result = await prismaMock.cardStatus.upsert({
      where: { cardId: 'test-card-1' },
      update: { isUp: true },
      create: { cardId: 'test-card-1', isUp: true },
    });

    expect(result).toEqual(mockStatus);
    expect(prismaMock.cardStatus.upsert).toHaveBeenCalledWith({
      where: { cardId: 'test-card-1' },
      update: { isUp: true },
      create: { cardId: 'test-card-1', isUp: true },
    });
  });

  it('should allow setting mock return values for host.findMany', async () => {
    const mockHosts = [
      {
        id: 'test-host-1',
        name: 'Test Host',
        address: '192.168.1.100',
        agentTokenHash: null,
        agentTokenPrefix: null,
        tokenRotatedAt: null,
        lastSeenAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    prismaMock.host.findMany.mockResolvedValue(mockHosts);

    const result = await prismaMock.host.findMany();

    expect(result).toEqual(mockHosts);
    expect(prismaMock.host.findMany).toHaveBeenCalledTimes(1);
  });

  it('should allow setting mock return values for action.create', async () => {
    const mockAction = {
      id: 'test-action-1',
      hostId: 'test-host-1',
      serviceId: 'test-service-1',
      kind: 'start',
      status: 'queued',
      requestedBy: 'test-user',
      requestedAt: new Date(),
      startedAt: null,
      finishedAt: null,
      exitCode: null,
      message: null,
      idempotencyKey: null,
    };

    prismaMock.action.create.mockResolvedValue(mockAction);

    const result = await prismaMock.action.create({
      data: {
        hostId: 'test-host-1',
        serviceId: 'test-service-1',
        kind: 'start',
        status: 'queued',
        requestedBy: 'test-user',
      },
    });

    expect(result).toEqual(mockAction);
    expect(prismaMock.action.create).toHaveBeenCalledWith({
      data: {
        hostId: 'test-host-1',
        serviceId: 'test-service-1',
        kind: 'start',
        status: 'queued',
        requestedBy: 'test-user',
      },
    });
  });
});
