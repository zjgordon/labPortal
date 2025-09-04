import { probeUrl, ProbeResult } from '../probe';

// Mock the http and https modules
const mockHttpRequest = jest.fn();
const mockHttpsRequest = jest.fn();

jest.mock('http', () => ({
  request: mockHttpRequest,
}));

jest.mock('https', () => ({
  request: mockHttpsRequest,
}));

describe('probeUrl', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockError: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock request object
    mockRequest = {
      on: jest.fn(),
      end: jest.fn(),
    };

    // Create mock response object
    mockResponse = {
      statusCode: 200,
    };

    // Create mock error object
    mockError = {
      code: 'ECONNREFUSED',
      message: 'Connection refused',
    };

    // Setup default mock behavior
    mockHttpRequest.mockReturnValue(mockRequest);
    mockHttpsRequest.mockReturnValue(mockRequest);
  });

  describe('HTTP Status Code Handling', () => {
    it('should return isUp=true for 2xx status codes', async () => {
      mockResponse.statusCode = 200;

      // Simulate successful response
      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') return;
        // Simulate response event immediately
        process.nextTick(() => callback(mockResponse));
      });

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(true);
      expect(result.lastHttp).toBe(200);
      expect(result.latencyMs).toBeGreaterThan(0);
      expect(result.message).toBe('HTTP 200');
    });

    it('should return isUp=true for 3xx status codes', async () => {
      mockResponse.statusCode = 302;

      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') return;
        process.nextTick(() => callback(mockResponse));
      });

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(true);
      expect(result.lastHttp).toBe(302);
      expect(result.message).toBe('HTTP 302');
    });

    it('should return isUp=false for 4xx status codes', async () => {
      mockResponse.statusCode = 404;

      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') return;
        process.nextTick(() => callback(mockResponse));
      });

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(false);
      expect(result.lastHttp).toBe(404);
      expect(result.message).toBe('HTTP 404');
    });

    it('should return isUp=false for 5xx status codes', async () => {
      mockResponse.statusCode = 500;

      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') return;
        process.nextTick(() => callback(mockResponse));
      });

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(false);
      expect(result.lastHttp).toBe(500);
      expect(result.message).toBe('HTTP 500');
    });

    it('should return isUp=true for fast 404 responses (special case)', async () => {
      mockResponse.statusCode = 404;

      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') return;
        // Simulate fast response (< 1000ms)
        setTimeout(() => callback(mockResponse), 100);
      });

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(true);
      expect(result.lastHttp).toBe(404);
      expect(result.message).toBe('HTTP 404');
    });

    it('should return isUp=false for slow 404 responses', async () => {
      mockResponse.statusCode = 404;

      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') return;
        // Simulate slow response (> 1000ms)
        setTimeout(() => callback(mockResponse), 1200);
      });

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(false);
      expect(result.lastHttp).toBe(404);
      expect(result.message).toBe('HTTP 404');
    });
  });

  describe('Network Error Handling', () => {
    it('should return isUp=false for connection refused errors', async () => {
      mockError.code = 'ECONNREFUSED';
      mockError.message = 'Connection refused';

      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') {
          process.nextTick(() => callback(mockError));
        }
      });

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(false);
      expect(result.latencyMs).toBeGreaterThan(0);
      expect(result.message).toBe('Connection refused - service not running');
    });

    it('should return isUp=false for host not found errors', async () => {
      mockError.code = 'ENOTFOUND';
      mockError.message = 'getaddrinfo ENOTFOUND';

      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') {
          process.nextTick(() => callback(mockError));
        }
      });

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(false);
      expect(result.message).toBe(
        'Host not found - check network configuration'
      );
    });

    it('should return isUp=false for connection timeout errors', async () => {
      mockError.code = 'ETIMEDOUT';
      mockError.message = 'Connection timed out';

      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') {
          process.nextTick(() => callback(mockError));
        }
      });

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(false);
      expect(result.message).toBe(
        'Connection timed out - service may be overloaded'
      );
    });

    it('should return isUp=false for connection reset errors', async () => {
      mockError.code = 'ECONNRESET';
      mockError.message = 'Connection reset by peer';

      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') {
          process.nextTick(() => callback(mockError));
        }
      });

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(false);
      expect(result.message).toBe('Connection reset by peer');
    });

    it('should return isUp=false for generic network errors', async () => {
      mockError.code = 'UNKNOWN_ERROR';
      mockError.message = 'Some network error';

      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') {
          process.nextTick(() => callback(mockError));
        }
      });

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(false);
      expect(result.message).toBe('Connection failed: Some network error');
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout after specified timeout duration', async () => {
      const timeoutMs = 1000;

      // Mock request that never responds
      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') return;
        // Don't call the response callback to simulate timeout
      });

      const result = await probeUrl('http://example.com', null, timeoutMs);

      expect(result.isUp).toBe(false);
      expect(result.latencyMs).toBeGreaterThanOrEqual(timeoutMs);
      expect(result.message).toContain('Request timeout after');
    });

    it('should use default timeout of 3000ms when not specified', async () => {
      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') return;
        // Don't call the response callback
      });

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(false);
      expect(result.message).toContain('Request timeout after 3000ms');
    });
  });

  describe('URL Handling', () => {
    it('should handle URLs with health paths', async () => {
      mockResponse.statusCode = 200;

      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') return;
        process.nextTick(() => callback(mockResponse));
      });

      await probeUrl('http://example.com', '/health');

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: 'example.com',
          path: '/health',
        }),
        expect.any(Function)
      );
    });

    it('should handle URLs that end with slash', async () => {
      mockResponse.statusCode = 200;

      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') return;
        process.nextTick(() => callback(mockResponse));
      });

      await probeUrl('http://example.com/', '/health');

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/health',
        }),
        expect.any(Function)
      );
    });

    it('should handle health paths that do not start with slash', async () => {
      mockResponse.statusCode = 200;

      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') return;
        process.nextTick(() => callback(mockResponse));
      });

      await probeUrl('http://example.com', 'health');

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/health',
        }),
        expect.any(Function)
      );
    });

    it('should use https module for https URLs', async () => {
      mockResponse.statusCode = 200;

      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') return;
        process.nextTick(() => callback(mockResponse));
      });

      await probeUrl('https://example.com');

      expect(mockHttpsRequest).toHaveBeenCalled();
      expect(mockHttpRequest).not.toHaveBeenCalled();
    });

    it('should handle relative paths by assuming localhost', async () => {
      mockResponse.statusCode = 200;

      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') return;
        process.nextTick(() => callback(mockResponse));
      });

      await probeUrl('/api/health');

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: 'localhost',
          path: '/api/health',
        }),
        expect.any(Function)
      );
    });

    it('should handle URLs without protocol by assuming http', async () => {
      mockResponse.statusCode = 200;

      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') return;
        process.nextTick(() => callback(mockResponse));
      });

      await probeUrl('example.com');

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: 'example.com',
        }),
        expect.any(Function)
      );
    });
  });

  describe('Method Fallback', () => {
    it('should try GET if HEAD fails', async () => {
      // First call (HEAD) fails
      mockRequest.on.mockImplementationOnce(
        (event: string, callback: Function) => {
          if (event === 'error') {
            process.nextTick(() => callback(mockError));
          }
        }
      );

      // Second call (GET) succeeds
      mockRequest.on.mockImplementationOnce(
        (event: string, callback: Function) => {
          if (event === 'error') return;
          process.nextTick(() => callback(mockResponse));
        }
      );

      mockResponse.statusCode = 200;

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(true);
      expect(result.lastHttp).toBe(200);
      expect(mockHttpRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe('Latency Measurement', () => {
    it('should measure latency correctly for successful requests', async () => {
      mockResponse.statusCode = 200;

      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') return;
        // Simulate 500ms response time
        setTimeout(() => callback(mockResponse), 500);
      });

      const result = await probeUrl('http://example.com');

      expect(result.latencyMs).toBeGreaterThanOrEqual(500);
      expect(result.latencyMs).toBeLessThan(600);
    });

    it('should measure latency correctly for failed requests', async () => {
      mockError.code = 'ECONNREFUSED';

      mockRequest.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') {
          // Simulate 200ms before error
          setTimeout(() => callback(mockError), 200);
        }
      });

      const result = await probeUrl('http://example.com');

      expect(result.latencyMs).toBeGreaterThanOrEqual(200);
      expect(result.latencyMs).toBeLessThan(300);
    });
  });
});
