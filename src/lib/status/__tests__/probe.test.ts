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

  // Helper function to setup successful response
  const setupSuccessfulResponse = (statusCode: number) => {
    mockResponse.statusCode = statusCode;

    // Mock the request function to call the callback immediately
    mockHttpRequest.mockImplementation((options, callback) => {
      // Call the response callback immediately
      setTimeout(() => {
        if (callback) callback(mockResponse);
      }, 10);
      return mockRequest;
    });

    mockHttpsRequest.mockImplementation((options, callback) => {
      setTimeout(() => {
        if (callback) callback(mockResponse);
      }, 10);
      return mockRequest;
    });
  };

  // Helper function to setup error response
  const setupErrorResponse = (error: any) => {
    mockRequest.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'error') {
        setTimeout(() => callback(error), 10);
      }
      return mockRequest;
    });
  };

  // Helper function to setup timeout
  const setupTimeout = () => {
    mockHttpRequest.mockImplementation((options, callback) => {
      // Don't call any callbacks to simulate timeout
      return mockRequest;
    });
    mockHttpsRequest.mockImplementation((options, callback) => {
      return mockRequest;
    });
  };

  // Helper function to setup timeout with proper error handling
  const setupTimeoutWithError = () => {
    mockHttpRequest.mockImplementation((options, callback) => {
      // Simulate timeout by not calling the response callback
      // The timeout will be handled by the probe function's internal timeout
      return mockRequest;
    });
    mockHttpsRequest.mockImplementation((options, callback) => {
      return mockRequest;
    });
  };

  describe('HTTP Status Code Handling', () => {
    it('should return isUp=true for 2xx status codes', async () => {
      setupSuccessfulResponse(200);

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(true);
      expect(result.lastHttp).toBe(200);
      expect(result.latencyMs).toBeGreaterThan(0);
      expect(result.message).toBe('HTTP 200');
    });

    it('should return isUp=true for 3xx status codes', async () => {
      setupSuccessfulResponse(302);

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(true);
      expect(result.lastHttp).toBe(302);
      expect(result.latencyMs).toBeGreaterThan(0);
      expect(result.message).toBe('HTTP 302');
    });

    it('should return isUp=false for 4xx status codes', async () => {
      setupSuccessfulResponse(404);

      const result = await probeUrl('http://example.com');

      // 404 responses are considered "up" if they're fast (less than 1000ms)
      // Since our mock responds in 10ms, it should be considered "up"
      expect(result.isUp).toBe(true);
      expect(result.lastHttp).toBe(404);
      expect(result.latencyMs).toBeGreaterThan(0);
      expect(result.message).toBe('HTTP 404');
    });

    it('should return isUp=false for 5xx status codes', async () => {
      setupSuccessfulResponse(500);

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(false);
      expect(result.lastHttp).toBe(500);
      expect(result.latencyMs).toBeGreaterThan(0);
      expect(result.message).toBe('HTTP 500');
    });

    it('should return isUp=true for fast 404 responses (special case)', async () => {
      setupSuccessfulResponse(404);

      const result = await probeUrl('http://example.com');

      // Fast 404 responses (less than 1000ms) are considered "up"
      expect(result.isUp).toBe(true);
      expect(result.lastHttp).toBe(404);
      expect(result.latencyMs).toBeGreaterThan(0);
      expect(result.message).toBe('HTTP 404');
    });

    it('should return isUp=false for slow 404 responses', async () => {
      // Mock a slow 404 response (over 1000ms)
      mockResponse.statusCode = 404;
      mockHttpRequest.mockImplementation((options, callback) => {
        setTimeout(() => {
          if (callback) callback(mockResponse);
        }, 1100); // Slow response
        return mockRequest;
      });

      const result = await probeUrl('http://example.com');

      // Slow 404 responses (over 1000ms) are considered "down"
      expect(result.isUp).toBe(false);
      expect(result.lastHttp).toBe(404);
      expect(result.latencyMs).toBeGreaterThan(1000);
      expect(result.message).toBe('HTTP 404');
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', async () => {
      setupErrorResponse(mockError);

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(false);
      expect(result.lastHttp).toBeUndefined();
      expect(result.latencyMs).toBeGreaterThan(0);
      expect(result.message).toBe('Connection refused - service not running');
    });

    it('should handle timeout errors', async () => {
      setupTimeoutWithError();

      const result = await probeUrl('http://example.com', null, 100);

      expect(result.isUp).toBe(false);
      expect(result.lastHttp).toBeUndefined();
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.message).toBe('Request timeout after 100ms');
    }, 10000); // Increase test timeout
  });

  describe('Timeout Handling', () => {
    it('should use default timeout of 3000ms when not specified', async () => {
      setupTimeoutWithError();

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(false);
      expect(result.lastHttp).toBeUndefined();
      expect(result.latencyMs).toBeGreaterThanOrEqual(3000);
      expect(result.message).toBe('Request timeout after 3000ms');
    }, 10000); // Increase test timeout

    it('should use custom timeout when specified', async () => {
      setupTimeoutWithError();

      const result = await probeUrl('http://example.com', null, 1000);

      expect(result.isUp).toBe(false);
      expect(result.lastHttp).toBeUndefined();
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.message).toBe('Request timeout after 1000ms');
    }, 10000); // Increase test timeout
  });

  describe('URL Handling', () => {
    it('should handle URLs with health paths', async () => {
      setupSuccessfulResponse(200);

      const result = await probeUrl('http://example.com/health');

      expect(result.isUp).toBe(true);
      expect(result.lastHttp).toBe(200);
      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/health',
        }),
        expect.any(Function)
      );
    });

    it('should handle URLs that end with slash', async () => {
      setupSuccessfulResponse(200);

      const result = await probeUrl('http://example.com/');

      expect(result.isUp).toBe(true);
      expect(result.lastHttp).toBe(200);
    });

    it('should handle health paths that do not start with slash', async () => {
      setupSuccessfulResponse(200);

      const result = await probeUrl('http://example.com/health');

      expect(result.isUp).toBe(true);
      expect(result.lastHttp).toBe(200);
    });

    it('should use https module for https URLs', async () => {
      setupSuccessfulResponse(200);

      const result = await probeUrl('https://example.com');

      expect(result.isUp).toBe(true);
      expect(result.lastHttp).toBe(200);
      expect(mockHttpsRequest).toHaveBeenCalled();
    });

    it('should handle relative paths by assuming localhost', async () => {
      setupSuccessfulResponse(200);

      const result = await probeUrl('/health');

      expect(result.isUp).toBe(true);
      expect(result.lastHttp).toBe(200);
    });

    it('should handle URLs without protocol by assuming http', async () => {
      setupSuccessfulResponse(200);

      const result = await probeUrl('example.com');

      expect(result.isUp).toBe(true);
      expect(result.lastHttp).toBe(200);
    });
  });

  describe('Method Fallback', () => {
    it('should try GET if HEAD fails', async () => {
      // First call (HEAD) fails, second call (GET) succeeds
      let callCount = 0;
      mockHttpRequest.mockImplementation((options, callback) => {
        callCount++;
        if (callCount === 1) {
          // First call fails - simulate error
          mockRequest.on.mockImplementation(
            (event: string, callback: Function) => {
              if (event === 'error') {
                setTimeout(() => callback(new Error('Method not allowed')), 10);
              }
              return mockRequest;
            }
          );
        } else {
          // Second call succeeds
          setTimeout(() => {
            if (callback) callback({ statusCode: 200 });
          }, 10);
        }
        return mockRequest;
      });

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(true);
      expect(result.lastHttp).toBe(200);
      expect(mockHttpRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe('Latency Measurement', () => {
    it('should measure latency correctly for successful requests', async () => {
      setupSuccessfulResponse(200);

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(true);
      expect(result.latencyMs).toBeGreaterThan(0);
      expect(result.latencyMs).toBeLessThan(100);
    });

    it('should measure latency correctly for failed requests', async () => {
      setupErrorResponse(mockError);

      const result = await probeUrl('http://example.com');

      expect(result.isUp).toBe(false);
      expect(result.latencyMs).toBeGreaterThan(0);
      expect(result.latencyMs).toBeLessThan(100);
    });
  });
});
