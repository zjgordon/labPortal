# Testing Guide

This document provides comprehensive information about the testing suite for the LabPortal application.

## 🧪 Test Suite Overview

The testing suite is built with **Jest** and **React Testing Library**, following modern testing best practices for Next.js applications.

### Test Coverage Areas

- **Component Testing**: React components with user interactions
- **API Route Testing**: Backend API endpoints and business logic
- **Middleware Testing**: Security headers, CSP, and rate limiting
- **Integration Testing**: Component interactions and data flow
- **Error Handling**: Graceful degradation and user feedback

## 🚀 Quick Start

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for CI/CD
npm run test:ci
```

### Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode for development |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:ci` | Run tests optimized for CI/CD |

## 📁 Test Structure

```
src/
├── app/
│   ├── __tests__/
│   │   └── page.test.tsx          # Main page tests
│   └── admin/
│       └── login/
│           └── __tests__/
│               └── page.test.tsx  # Admin login tests
├── components/
│   └── __tests__/
│       └── lab-card.test.tsx      # LabCard component tests
├── lib/
│   └── test-utils.tsx             # Test utilities and mocks
└── api/
    └── __tests__/
        ├── cards.test.ts           # Cards API tests
        └── status.test.ts          # Status API tests
```

## 🧩 Test Utilities

### `src/lib/test-utils.tsx`

Centralized test utilities providing:

- **Mock Data**: Predefined test data for cards, status, and responses
- **Custom Render**: Enhanced render function with providers
- **Mock Helpers**: Utilities for mocking fetch, localStorage, and other APIs
- **Test Constants**: Common values used across tests

### Key Utilities

```typescript
// Mock data
export const mockCards = [...]
export const mockCardStatus = {...}

// Mock responses
export const mockFetchResponse = (data, status)
export const mockFetchError = (error, status)

// Custom render
export const render = (ui, options)
```

## 🎯 Component Testing

### LabCard Component (`src/components/__tests__/lab-card.test.tsx`)

**Coverage**: Status fetching, UI rendering, user interactions, error handling

**Key Test Areas**:
- ✅ **Rendering**: Title, description, icons, cyberpunk styling
- ✅ **Status Fetching**: Initial fetch, polling, error handling
- ✅ **Status Display**: Up/down states, staleness detection, formatting
- ✅ **User Interactions**: Click handling, URL validation, popup blocking
- ✅ **Polling**: Interval management, cleanup on unmount
- ✅ **Error Handling**: Network errors, invalid data, graceful degradation

**Test Patterns**:
```typescript
describe('LabCard', () => {
  describe('Rendering', () => { /* ... */ })
  describe('Status Fetching', () => { /* ... */ })
  describe('Status Display', () => { /* ... */ })
  describe('User Interactions', () => { /* ... */ })
  describe('Polling', () => { /* ... */ })
  describe('Error Handling', () => { /* ... */ })
})
```

### HomePage Component (`src/app/__tests__/page.test.tsx`)

**Coverage**: Main portal interface, search, grouping, navigation

**Key Test Areas**:
- ✅ **Rendering**: Header, cyberpunk theme, live time display
- ✅ **LabCardsGrid**: Loading states, data fetching, error handling
- ✅ **Search Functionality**: Real-time filtering, case insensitivity, clear search
- ✅ **Category Grouping**: Automatic grouping, sorting, tool counts
- ✅ **Navigation**: Admin access, responsive design
- ✅ **Error States**: No tools, network errors, graceful degradation

**Test Patterns**:
```typescript
describe('HomePage', () => {
  describe('Rendering', () => { /* ... */ })
  describe('LabCardsGrid', () => { /* ... */ })
  describe('Search Functionality', () => { /* ... */ })
  describe('Category Grouping', () => { /* ... */ })
  describe('Navigation', () => { /* ... */ })
  describe('Responsive Design', () => { /* ... */ })
  describe('Error States', () => { /* ... */ })
})
```

### AdminLoginPage Component (`src/app/admin/login/__tests__/page.test.tsx`)

**Coverage**: Authentication, form handling, navigation, error display

**Key Test Areas**:
- ✅ **Rendering**: Form elements, cyberpunk styling, back button
- ✅ **Form Handling**: Input validation, required fields, auto-focus
- ✅ **Authentication**: Login flow, localStorage, navigation
- ✅ **Navigation**: Back to portal functionality
- ✅ **Error Display**: Styled error boxes, error clearing
- ✅ **Form Submission**: Prevent default, data submission
- ✅ **Accessibility**: Labels, roles, heading structure
- ✅ **Styling**: Dark theme, emerald accents

## 🔌 API Testing

### Cards API (`src/app/api/__tests__/cards.test.ts`)

**Coverage**: GET and POST operations, validation, error handling

**Key Test Areas**:
- ✅ **GET /api/cards**: Enabled cards, ordering, error handling
- ✅ **POST /api/cards**: Card creation, validation, authorization
- ✅ **Error Handling**: Database errors, validation failures, auth failures
- ✅ **Business Logic**: Order calculation, status inclusion

### Status API (`src/app/api/__tests__/status.test.ts`)

**Coverage**: Status checking, caching, probing, fail tracking

**Key Test Areas**:
- ✅ **Caching**: 30-second window, nextCheckAt logic
- ✅ **Probing**: URL checking, health path support, timeout handling
- ✅ **Fail Tracking**: Incrementing failCount, exponential backoff
- ✅ **Error Handling**: Network errors, validation, database issues
- ✅ **Business Logic**: Status updates, fail count management

## 🛡️ Middleware Testing

### Security Middleware (`src/middleware.test.ts`)

**Coverage**: Security headers, CSP, rate limiting, request processing

**Key Test Areas**:
- ✅ **Security Headers**: XSS protection, frame options, content type
- ✅ **Content Security Policy**: Different policies for admin vs public pages
- ✅ **Rate Limiting**: Status API protection, IP handling, error responses
- ✅ **Request Processing**: All HTTP methods, complex paths, query params
- ✅ **Configuration**: Matcher patterns, static asset exclusion

## 🎭 Mocking Strategy

### Global Mocks

```typescript
// jest.setup.js
jest.mock('next/navigation')     // Router functions
jest.mock('next/image')          // Image component
global.fetch = jest.fn()         // Fetch API
global.localStorage = {...}      // Local storage
global.window.open = jest.fn()   // Window open
```

### Component Mocks

```typescript
// Mock StatusIndicator component
jest.mock('../status-indicator', () => ({
  StatusIndicator: ({ isUp, isStale }) => (
    <div data-testid="status-indicator" data-is-up={isUp} data-is-stale={isStale}>
      Status: {isUp ? 'UP' : 'DOWN'} {isStale ? '(STALE)' : ''}
    </div>
  ),
}))
```

### API Mocks

```typescript
// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    card: { findMany: jest.fn(), create: jest.fn() },
    cardStatus: { upsert: jest.fn() },
  },
}))

// Mock probe function
jest.mock('@/lib/probe', () => ({
  probeUrl: jest.fn(),
}))
```

## 📊 Coverage Goals

### Current Coverage Targets

- **Global Coverage**: 70% minimum
- **Component Coverage**: 80% minimum
- **API Coverage**: 90% minimum
- **Middleware Coverage**: 95% minimum

### Coverage Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Branches | 70% | TBD |
| Functions | 70% | TBD |
| Lines | 70% | TBD |
| Statements | 70% | TBD |

## 🧪 Testing Best Practices

### 1. Test Organization

- **Group related tests** using `describe` blocks
- **Use descriptive test names** that explain the expected behavior
- **Follow AAA pattern**: Arrange, Act, Assert
- **Test one thing per test case**

### 2. Component Testing

- **Test user interactions** over implementation details
- **Use semantic queries** (getByRole, getByLabelText)
- **Test accessibility** features and ARIA attributes
- **Mock external dependencies** (APIs, localStorage, etc.)

### 3. API Testing

- **Test happy path** and error scenarios
- **Verify business logic** and data transformations
- **Test edge cases** and boundary conditions
- **Mock database calls** for isolated testing

### 4. Error Handling

- **Test graceful degradation** when things go wrong
- **Verify user feedback** for errors
- **Test fallback mechanisms** and alternative flows
- **Ensure errors don't crash the application**

## 🚨 Common Testing Patterns

### Async Testing

```typescript
it('handles async operations', async () => {
  const user = userEvent.setup()
  
  // Setup
  render(<Component />)
  
  // Act
  await user.click(button)
  
  // Assert
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument()
  })
})
```

### Mock Verification

```typescript
it('calls the correct API', async () => {
  // Act
  await user.click(button)
  
  // Assert
  expect(global.fetch).toHaveBeenCalledWith(
    '/api/endpoint',
    expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
  )
})
```

### Error Testing

```typescript
it('handles network errors gracefully', async () => {
  // Arrange
  global.fetch.mockRejectedValueOnce(new Error('Network error'))
  
  // Act
  render(<Component />)
  
  // Assert
  await waitFor(() => {
    expect(screen.getByText('Network error occurred')).toBeInTheDocument()
  })
})
```

## 🔧 Configuration

### Jest Configuration (`jest.config.js`)

- **Next.js Integration**: Uses `next/jest` for optimal Next.js support
- **TypeScript Support**: Full TypeScript compilation and type checking
- **Path Mapping**: Supports `@/` alias for clean imports
- **Coverage Thresholds**: Enforces minimum coverage requirements
- **Test Environment**: Uses `jsdom` for DOM testing

### Test Setup (`jest.setup.js`)

- **Global Mocks**: Next.js router, Image component, fetch API
- **Test Utilities**: Custom render function with providers
- **Environment Setup**: Console mocking, localStorage mocking

## 📝 Writing New Tests

### 1. Component Test Template

```typescript
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComponentName } from '../component-name'

describe('ComponentName', () => {
  const defaultProps = {
    // Define default props
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders correctly', () => {
      render(<ComponentName {...defaultProps} />)
      // Assertions
    })
  })

  describe('User Interactions', () => {
    it('handles user input', async () => {
      const user = userEvent.setup()
      render(<ComponentName {...defaultProps} />)
      // Test interactions
    })
  })
})
```

### 2. API Test Template

```typescript
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    // Mock Prisma methods
  },
}))

describe('/api/endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/endpoint', () => {
    it('returns expected data', async () => {
      // Setup mocks
      // Make request
      // Assert response
    })
  })
})
```

## 🎯 Future Testing Enhancements

### Planned Improvements

1. **E2E Testing**: Add Playwright or Cypress for full application testing
2. **Visual Testing**: Screenshot testing for UI consistency
3. **Performance Testing**: Lighthouse CI integration
4. **Accessibility Testing**: Automated a11y testing with axe-core
5. **Contract Testing**: API contract validation

### Test Automation

- **Pre-commit hooks**: Run tests before code commits
- **CI/CD Integration**: Automated testing in deployment pipeline
- **Coverage Reports**: Automated coverage reporting and tracking
- **Test Parallelization**: Faster test execution in CI

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Note**: This testing suite is designed to provide comprehensive coverage while maintaining fast execution times and clear, maintainable test code. Regular updates and improvements are made based on testing best practices and application requirements.
