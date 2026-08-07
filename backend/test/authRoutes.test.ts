import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import http from 'http';
import { createApp } from '../src/app.js';
import { authService } from '../src/modules/auth/service/authService.js';
import { getEnv } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

vi.mock('../src/modules/auth/service/authService.js');

describe('Auth Routes Integration Tests', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.JWT_ACCESS_SECRET = 'supersecretaccesskey1234567890123';
    process.env.JWT_REFRESH_SECRET = 'supersecretrefreshkey123456789012';

    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => {
      if (server) server.close(() => resolve());
      else resolve();
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('returns 422 on invalid registration payload', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid-email', password: 'short' }),
      });

      const body = await res.json();
      expect(res.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 201 on valid registration request', async () => {
      vi.mocked(authService.register).mockResolvedValueOnce({
        user: { _id: 'u1', email: 'test@example.com', name: 'Test User' } as any,
        settings: { theme: 'system' } as any,
        tokens: { accessToken: 'access_123', refreshToken: 'refresh_123' },
      });

      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        }),
      });

      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.tokens.accessToken).toBe('access_123');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns 422 when login body is missing fields', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      expect(res.status).toBe(422);
    });

    it('returns 200 on successful login', async () => {
      vi.mocked(authService.login).mockResolvedValueOnce({
        user: { _id: 'u1', email: 'test@example.com', name: 'Test User' } as any,
        settings: { theme: 'dark' } as any,
        tokens: { accessToken: 'access_abc', refreshToken: 'refresh_abc' },
      });

      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
        }),
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.tokens.accessToken).toBe('access_abc');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('returns 400 when refreshToken is missing', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(422);
    });

    it('returns rotated tokens on successful refresh', async () => {
      vi.mocked(authService.refreshTokens).mockResolvedValueOnce({
        accessToken: 'new_access',
        refreshToken: 'new_refresh',
      });

      const res = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'old_refresh_token' }),
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.tokens.accessToken).toBe('new_access');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`);
      expect(res.status).toBe(401);
    });

    it('returns 200 and user data when valid access token is provided', async () => {
      const validToken = jwt.sign(
        { userId: '507f1f77bcf86cd799439011', tokenVersion: 1 },
        getEnv().JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
      );

      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${validToken}` },
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.user.id).toBe('507f1f77bcf86cd799439011');
    });
  });

  describe('PATCH /api/v1/auth/password', () => {
    it('returns 401 if unauthenticated', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: 'Old', newPassword: 'NewPassword123!' }),
      });
      expect(res.status).toBe(401);
    });

    it('changes password successfully when authenticated and body valid', async () => {
      const validToken = jwt.sign(
        { userId: '507f1f77bcf86cd799439011', tokenVersion: 1 },
        getEnv().JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
      );

      vi.mocked(authService.changePassword).mockResolvedValueOnce(undefined);

      const res = await fetch(`${baseUrl}/api/v1/auth/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        }),
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.message).toBe('Password changed successfully');
    });
  });

  describe('POST /api/v1/auth/forgot-password & reset-password', () => {
    it('returns generic success message for forgot password', async () => {
      vi.mocked(authService.forgotPassword).mockResolvedValueOnce('mock_token');

      const res = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.message).toBe('If the email exists, a reset link has been sent');
    });

    it('resets password successfully with valid reset token', async () => {
      vi.mocked(authService.resetPassword).mockResolvedValueOnce(undefined);

      const res = await fetch(`${baseUrl}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'valid_reset_token',
          newPassword: 'BrandNewPassword123!',
        }),
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.message).toBe('Password reset successfully');
    });
  });
});
