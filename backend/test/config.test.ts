import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadEnv, getEnv } from '../src/config/env.js';
import { connectDB, disconnectDB, getConnectionStatus } from '../src/config/db.js';

describe('Config Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      JWT_ACCESS_SECRET: 'supersecretaccesskey1234567890123',
      JWT_REFRESH_SECRET: 'supersecretrefreshkey123456789012',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('env config', () => {
    it('loads environment variables correctly with default fallbacks', () => {
      const env = loadEnv();
      expect(env).toBeDefined();
      expect(env.PORT).toBe(4000);
      expect(env.NODE_ENV).toBe('test');
      expect(env.JWT_ACCESS_SECRET).toBeDefined();
      expect(env.JWT_REFRESH_SECRET).toBeDefined();
    });

    it('returns cached env object when getEnv is called', () => {
      const env1 = getEnv();
      const env2 = getEnv();
      expect(env1).toBe(env2);
      expect(env1.PORT).toBe(4000);
    });
  });

  describe('db connection status helper', () => {
    it('returns false when disconnected', () => {
      expect(getConnectionStatus()).toBe(false);
    });

    it('handles disconnectDB safely when not connected', async () => {
      await expect(disconnectDB()).resolves.not.toThrow();
      expect(getConnectionStatus()).toBe(false);
    });
  });
});
