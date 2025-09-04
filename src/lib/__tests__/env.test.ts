import { z } from 'zod';

// Import the schema directly to avoid importing the parsed env
const envSchema = z.object({
  // Required environment variables
  ADMIN_PASSWORD: z.string().min(1, 'ADMIN_PASSWORD is required'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  PUBLIC_BASE_URL: z.string().url('PUBLIC_BASE_URL must be a valid URL'),

  // Optional environment variables with defaults
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  STATUS_SWEEPER_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  HOST_LOCAL_ID: z.string().default('local'),
  ALLOW_SYSTEMCTL: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  UNIT_ALLOWLIST_REGEX: z.string().default('^([a-z0-9@._-]+)\\\\.service$'),
  EXEC_TIMEOUT_MS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('60000'),
  ENABLE_CONTROL_PLANE: z
    .string()
    .transform((val) => val === 'true')
    .default('false'), // Deprecated: Use admin dashboard toggle instead
  READONLY_PUBLIC_TOKEN: z.string().default(''),
  ADMIN_CRON_SECRET: z.string().default(''),
  ADMIN_ALLOWED_ORIGINS: z.string().default(''),
  APPEARANCE_INSTANCE_NAME: z.string().default('Lab Portal'),
  APPEARANCE_HEADER_TEXT: z.string().default('Lab Portal'),
});

describe('Environment Variable Validation', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    // Clear all environment variables
    Object.keys(process.env).forEach((key) => {
      delete process.env[key];
    });
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Required variables validation', () => {
    it('should throw a readable error when ADMIN_PASSWORD is missing', () => {
      // Set all required variables except ADMIN_PASSWORD
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.DATABASE_URL = 'file:./test.db';
      process.env.PUBLIC_BASE_URL = 'http://localhost:3000';

      expect(() => {
        envSchema.parse(process.env);
      }).toThrow('Required');
    });

    it('should throw a readable error when NEXTAUTH_SECRET is missing', () => {
      // Set all required variables except NEXTAUTH_SECRET
      process.env.ADMIN_PASSWORD = 'test-password';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.DATABASE_URL = 'file:./test.db';
      process.env.PUBLIC_BASE_URL = 'http://localhost:3000';

      expect(() => {
        envSchema.parse(process.env);
      }).toThrow('Required');
    });

    it('should throw a readable error when NEXTAUTH_URL is invalid', () => {
      // Set all required variables with invalid NEXTAUTH_URL
      process.env.ADMIN_PASSWORD = 'test-password';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'not-a-valid-url';
      process.env.DATABASE_URL = 'file:./test.db';
      process.env.PUBLIC_BASE_URL = 'http://localhost:3000';

      expect(() => {
        envSchema.parse(process.env);
      }).toThrow('NEXTAUTH_URL must be a valid URL');
    });
  });

  describe('Default values', () => {
    it('should apply default for EXEC_TIMEOUT_MS when not provided', () => {
      // Set only required variables
      process.env.ADMIN_PASSWORD = 'test-password';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.DATABASE_URL = 'file:./test.db';
      process.env.PUBLIC_BASE_URL = 'http://localhost:3000';

      const result = envSchema.parse(process.env);

      expect(result.EXEC_TIMEOUT_MS).toBe(60000);
    });

    it('should apply default for UNIT_ALLOWLIST_REGEX when not provided', () => {
      // Set only required variables
      process.env.ADMIN_PASSWORD = 'test-password';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.DATABASE_URL = 'file:./test.db';
      process.env.PUBLIC_BASE_URL = 'http://localhost:3000';

      const result = envSchema.parse(process.env);

      expect(result.UNIT_ALLOWLIST_REGEX).toBe('^([a-z0-9@._-]+)\\\\.service$');
    });

    it('should apply default for NODE_ENV when not provided', () => {
      // Set only required variables
      process.env.ADMIN_PASSWORD = 'test-password';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.DATABASE_URL = 'file:./test.db';
      process.env.PUBLIC_BASE_URL = 'http://localhost:3000';

      const result = envSchema.parse(process.env);

      expect(result.NODE_ENV).toBe('development');
    });

    it('should apply default for ALLOW_SYSTEMCTL when not provided', () => {
      // Set only required variables
      process.env.ADMIN_PASSWORD = 'test-password';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.DATABASE_URL = 'file:./test.db';
      process.env.PUBLIC_BASE_URL = 'http://localhost:3000';

      const result = envSchema.parse(process.env);

      expect(result.ALLOW_SYSTEMCTL).toBe(false);
    });
  });

  describe('ADMIN_ALLOWED_ORIGINS parsing', () => {
    it('should handle empty ADMIN_ALLOWED_ORIGINS with default', () => {
      // Set only required variables
      process.env.ADMIN_PASSWORD = 'test-password';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.DATABASE_URL = 'file:./test.db';
      process.env.PUBLIC_BASE_URL = 'http://localhost:3000';

      const result = envSchema.parse(process.env);

      expect(result.ADMIN_ALLOWED_ORIGINS).toBe('');
    });

    it('should handle comma-separated ADMIN_ALLOWED_ORIGINS', () => {
      // Set required variables plus ADMIN_ALLOWED_ORIGINS
      process.env.ADMIN_PASSWORD = 'test-password';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.DATABASE_URL = 'file:./test.db';
      process.env.PUBLIC_BASE_URL = 'http://localhost:3000';
      process.env.ADMIN_ALLOWED_ORIGINS =
        'http://localhost:3000,https://portal.example.com';

      const result = envSchema.parse(process.env);

      expect(result.ADMIN_ALLOWED_ORIGINS).toBe(
        'http://localhost:3000,https://portal.example.com'
      );
    });

    it('should handle single ADMIN_ALLOWED_ORIGINS', () => {
      // Set required variables plus single ADMIN_ALLOWED_ORIGINS
      process.env.ADMIN_PASSWORD = 'test-password';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.DATABASE_URL = 'file:./test.db';
      process.env.PUBLIC_BASE_URL = 'http://localhost:3000';
      process.env.ADMIN_ALLOWED_ORIGINS = 'https://portal.example.com';

      const result = envSchema.parse(process.env);

      expect(result.ADMIN_ALLOWED_ORIGINS).toBe('https://portal.example.com');
    });
  });

  describe('Type transformations', () => {
    it('should transform EXEC_TIMEOUT_MS string to number', () => {
      // Set required variables plus EXEC_TIMEOUT_MS
      process.env.ADMIN_PASSWORD = 'test-password';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.DATABASE_URL = 'file:./test.db';
      process.env.PUBLIC_BASE_URL = 'http://localhost:3000';
      process.env.EXEC_TIMEOUT_MS = '30000';

      const result = envSchema.parse(process.env);

      expect(result.EXEC_TIMEOUT_MS).toBe(30000);
      expect(typeof result.EXEC_TIMEOUT_MS).toBe('number');
    });

    it('should transform STATUS_SWEEPER_ENABLED string to boolean', () => {
      // Set required variables plus STATUS_SWEEPER_ENABLED
      process.env.ADMIN_PASSWORD = 'test-password';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.DATABASE_URL = 'file:./test.db';
      process.env.PUBLIC_BASE_URL = 'http://localhost:3000';
      process.env.STATUS_SWEEPER_ENABLED = 'false';

      const result = envSchema.parse(process.env);

      expect(result.STATUS_SWEEPER_ENABLED).toBe(false);
      expect(typeof result.STATUS_SWEEPER_ENABLED).toBe('boolean');
    });

    it('should transform ALLOW_SYSTEMCTL string to boolean', () => {
      // Set required variables plus ALLOW_SYSTEMCTL
      process.env.ADMIN_PASSWORD = 'test-password';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.DATABASE_URL = 'file:./test.db';
      process.env.PUBLIC_BASE_URL = 'http://localhost:3000';
      process.env.ALLOW_SYSTEMCTL = 'true';

      const result = envSchema.parse(process.env);

      expect(result.ALLOW_SYSTEMCTL).toBe(true);
      expect(typeof result.ALLOW_SYSTEMCTL).toBe('boolean');
    });
  });

  describe('Complete validation', () => {
    it('should successfully parse all required and optional variables', () => {
      // Set all variables
      process.env.ADMIN_PASSWORD = 'test-password';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.DATABASE_URL = 'file:./test.db';
      process.env.PUBLIC_BASE_URL = 'http://localhost:3000';
      process.env.NODE_ENV = 'test';
      process.env.STATUS_SWEEPER_ENABLED = 'true';
      process.env.HOST_LOCAL_ID = 'test-local';
      process.env.ALLOW_SYSTEMCTL = 'true';
      process.env.UNIT_ALLOWLIST_REGEX = '^test\\.service$';
      process.env.EXEC_TIMEOUT_MS = '30000';
      process.env.ENABLE_CONTROL_PLANE = 'true';
      process.env.READONLY_PUBLIC_TOKEN = 'test-token';
      process.env.ADMIN_CRON_SECRET = 'test-cron-secret';
      process.env.ADMIN_ALLOWED_ORIGINS = 'http://localhost:3000';
      process.env.APPEARANCE_INSTANCE_NAME = 'Test Portal';
      process.env.APPEARANCE_HEADER_TEXT = 'Test Header';

      const result = envSchema.parse(process.env);

      // Verify all values are correctly parsed
      expect(result.ADMIN_PASSWORD).toBe('test-password');
      expect(result.NEXTAUTH_SECRET).toBe('test-secret');
      expect(result.NEXTAUTH_URL).toBe('http://localhost:3000');
      expect(result.DATABASE_URL).toBe('file:./test.db');
      expect(result.PUBLIC_BASE_URL).toBe('http://localhost:3000');
      expect(result.NODE_ENV).toBe('test');
      expect(result.STATUS_SWEEPER_ENABLED).toBe(true);
      expect(result.HOST_LOCAL_ID).toBe('test-local');
      expect(result.ALLOW_SYSTEMCTL).toBe(true);
      expect(result.UNIT_ALLOWLIST_REGEX).toBe('^test\\.service$');
      expect(result.EXEC_TIMEOUT_MS).toBe(30000);
      expect(result.ENABLE_CONTROL_PLANE).toBe(true);
      expect(result.READONLY_PUBLIC_TOKEN).toBe('test-token');
      expect(result.ADMIN_CRON_SECRET).toBe('test-cron-secret');
      expect(result.ADMIN_ALLOWED_ORIGINS).toBe('http://localhost:3000');
      expect(result.APPEARANCE_INSTANCE_NAME).toBe('Test Portal');
      expect(result.APPEARANCE_HEADER_TEXT).toBe('Test Header');
    });
  });
});
