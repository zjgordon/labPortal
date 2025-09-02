import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Mock data for testing
export const mockCards = [
  {
    id: '1',
    title: 'Test Lab Tool 1',
    description: 'A test lab tool for testing purposes',
    url: 'http://localhost:8080',
    iconPath: '/icons/test1.svg',
    order: 1,
    isEnabled: true,
    group: 'Development',
  },
  {
    id: '2',
    title: 'Test Lab Tool 2',
    description: 'Another test lab tool',
    url: 'http://localhost:8081',
    iconPath: '/icons/test2.svg',
    order: 2,
    isEnabled: true,
    group: 'Development',
  },
  {
    id: '3',
    title: 'Production Tool',
    description: 'A production tool for testing',
    url: 'http://localhost:8082',
    iconPath: '/icons/prod.svg',
    order: 1,
    isEnabled: true,
    group: 'Production',
  },
]

export const mockCardStatus = {
  isUp: true,
  lastChecked: new Date().toISOString(),
  lastHttp: 200,
  latencyMs: 150,
  message: 'OK',
  failCount: 0,
  nextCheckAt: null,
}

export const mockCardStatusDown = {
  isUp: false,
  lastChecked: new Date().toISOString(),
  lastHttp: 500,
  latencyMs: null,
  message: 'Internal Server Error',
  failCount: 2,
  nextCheckAt: new Date(Date.now() + 60000).toISOString(),
}

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Mock fetch responses
export const mockFetchResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  })
}

export const mockFetchError = (error: string, status = 500) => {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error }),
    text: () => Promise.resolve(error),
  })
}

// Test constants
export const TEST_TIMEOUT = 10000
export const POLLING_INTERVAL = 30000
