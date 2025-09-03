// Mock Prisma before importing the module under test
jest.mock('../../prisma', () => ({
  prisma: {
    appearance: {
      findUnique: jest.fn()
    }
  }
}))

import { getAppearance, clearAppearanceCache, type AppearanceConfig } from '../appearance'

const mockPrisma = require('../../prisma').prisma

describe('Appearance Config', () => {
  beforeEach(() => {
    clearAppearanceCache()
    jest.clearAllMocks()
  })

  it('should return cached data when cache is valid', async () => {
    const mockConfig: AppearanceConfig = {
      id: 1,
      instanceName: 'Test Lab',
      headerText: 'Welcome',
      showClock: false,
      theme: 'system',
      updatedAt: new Date()
    }

    mockPrisma.appearance.findUnique.mockResolvedValue(mockConfig)

    // First call should hit database
    const result1 = await getAppearance()
    expect(result1).toEqual(mockConfig)
    expect(mockPrisma.appearance.findUnique).toHaveBeenCalledTimes(1)

    // Second call should use cache
    const result2 = await getAppearance()
    expect(result2).toEqual(mockConfig)
    expect(mockPrisma.appearance.findUnique).toHaveBeenCalledTimes(1)
  })

  it('should force refresh when revalidate is true', async () => {
    const mockConfig: AppearanceConfig = {
      id: 1,
      instanceName: 'Test Lab',
      headerText: 'Welcome',
      showClock: false,
      theme: 'system',
      updatedAt: new Date()
    }

    mockPrisma.appearance.findUnique.mockResolvedValue(mockConfig)

    // First call
    await getAppearance()
    expect(mockPrisma.appearance.findUnique).toHaveBeenCalledTimes(1)

    // Force refresh
    await getAppearance(true)
    expect(mockPrisma.appearance.findUnique).toHaveBeenCalledTimes(2)
  })

  it('should fallback to env vars when database fails', async () => {
    const originalEnv = process.env
    process.env.APPEARANCE_INSTANCE_NAME = 'Env Lab'
    process.env.APPEARANCE_HEADER_TEXT = 'Env Header'

    mockPrisma.appearance.findUnique.mockRejectedValue(new Error('DB Error'))

    const result = await getAppearance()
    
    expect(result.instanceName).toBe('Env Lab')
    expect(result.headerText).toBe('Env Header')
    expect(result.theme).toBe('system')
    expect(result.showClock).toBe(false)

    process.env = originalEnv
  })

  it('should use default values when env vars are not set', async () => {
    const originalEnv = process.env
    delete process.env.APPEARANCE_INSTANCE_NAME
    delete process.env.APPEARANCE_HEADER_TEXT

    mockPrisma.appearance.findUnique.mockRejectedValue(new Error('DB Error'))

    const result = await getAppearance()
    
    expect(result.instanceName).toBe('Lab Portal')
    expect(result.headerText).toBe(null)
    expect(result.theme).toBe('system')
    expect(result.showClock).toBe(false)

    process.env = originalEnv
  })
})
