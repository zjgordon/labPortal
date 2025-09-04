require('@testing-library/jest-dom');
const React = require('react');

// Set up test environment variables
process.env.ADMIN_PASSWORD = 'test-admin-password';
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-key-for-testing-only';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'file:./test.db';
process.env.PUBLIC_BASE_URL = 'http://localhost:3000';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return require('react').createElement('img', props);
  },
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: class NextRequest {
    constructor(url, init) {
      Object.defineProperty(this, 'url', {
        value: url,
        writable: false,
        configurable: true,
      });
      this.method = init?.method || 'GET';
      this.body = init?.body || null;
      this.headers = new Headers(init?.headers);
    }

    json() {
      return Promise.resolve(JSON.parse(this.body));
    }
  },
  NextResponse: {
    json: (data, init) => {
      const response = new Response(JSON.stringify(data), {
        status: init?.status || 200,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      });
      return response;
    },
  },
}));

// Prisma client is now mocked via tests/utils/prismaMock.ts

// Mock global fetch - this will be overridden by test-specific mocks
global.fetch = jest.fn().mockImplementation((url, options) => {
  // Mock appearance API
  if (url === '/api/public/appearance') {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            instanceName: 'Test Instance',
            headerText: 'Test Header Message',
            theme: 'system',
          },
        }),
    });
  }

  // Mock cards API - return mock cards by default
  if (url === '/api/cards') {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve([
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
        ]),
    });
  }

  console.warn(`Unhandled fetch to: ${url} with options:`, options);
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('{}'),
  });
});

// Mock Request constructor if not available
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(url, init) {
      Object.defineProperty(this, 'url', {
        value: url,
        writable: false,
        configurable: true,
      });
      this.method = init?.method || 'GET';
      this.body = init?.body || null;
      this.headers = new Headers(init?.headers);
    }
  };
}

// Mock Response constructor if not available
if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = new Headers(init?.headers);
      this.ok = this.status >= 200 && this.status < 300;
    }

    json() {
      if (typeof this.body === 'string') {
        try {
          return Promise.resolve(JSON.parse(this.body));
        } catch {
          return Promise.resolve({});
        }
      }
      return Promise.resolve(this.body || {});
    }
  };
}

// Mock localStorage with proper Jest mock methods
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
  },
  writable: true,
});

// Mock window.open
global.window.open = jest.fn();

// Mock console methods to reduce test noise
global.console = {
  ...console,
  // Uncomment to ignore a specific console method during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // error: jest.fn(),
};
