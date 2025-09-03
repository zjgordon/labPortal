import '@testing-library/jest-dom';

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
    return <img {...props} />;
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

// Mock Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    card: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    cardStatus: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    host: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    service: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    action: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    appearance: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
  })),
}));

// Mock global fetch
global.fetch = jest.fn((url, options) => {
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
