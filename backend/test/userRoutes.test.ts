import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import http from 'http';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { userService } from '../src/modules/users/service/userService.js';
import { getEnv } from '../src/config/env.js';

vi.mock('../src/modules/users/service/userService.js');

describe('User Routes Integration Tests', () => {
  let server: http.Server;
  let baseUrl: string;
  let accessToken: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.JWT_ACCESS_SECRET = 'supersecretaccesskey1234567890123';
    process.env.JWT_REFRESH_SECRET = 'supersecretrefreshkey123456789012';

    accessToken = jwt.sign(
      { userId: '507f1f77bcf86cd799439011', email: 'test@example.com', tokenVersion: 1 },
      getEnv().JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

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

  describe('GET /api/v1/users/me', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await fetch(`${baseUrl}/api/v1/users/me`);
      expect(res.status).toBe(401);
    });

    it('returns 200 with the user profile and settings', async () => {
      vi.mocked(userService.getProfile).mockResolvedValueOnce({
        user: {
          _id: 'u1',
          email: 'test@example.com',
          name: 'Test User',
          avatarUrl: null,
          dateOfBirth: null,
          sex: null,
          heightCm: null,
          timezone: 'UTC',
          locale: 'en-US',
          units: 'metric',
          goals: null,
          onboardingCompletedAt: null,
          status: 'active',
          authProviders: [],
        } as any,
        settings: { theme: 'system', notifications: { general: true } } as any,
      });

      const res = await fetch(`${baseUrl}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.user.email).toBe('test@example.com');
      expect(body.data.settings.theme).toBe('system');
    });

    it('returns 404 when the underlying user is missing', async () => {
      vi.mocked(userService.getProfile).mockRejectedValueOnce(new Error('USER_NOT_FOUND'));

      const res = await fetch(`${baseUrl}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    it('returns 422 for an unknown field', async () => {
      const res = await fetch(`${baseUrl}/api/v1/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ notARealField: true }),
      });

      expect(res.status).toBe(422);
    });

    it('updates the profile and returns 200', async () => {
      vi.mocked(userService.updateProfile).mockResolvedValueOnce({
        _id: 'u1',
        email: 'test@example.com',
        name: 'New Name',
        avatarUrl: null,
        dateOfBirth: null,
        sex: null,
        heightCm: null,
        timezone: 'UTC',
        locale: 'en-US',
        units: 'metric',
        goals: null,
        onboardingCompletedAt: null,
        status: 'active',
        authProviders: [],
      } as any);

      const res = await fetch(`${baseUrl}/api/v1/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name: 'New Name' }),
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.user.name).toBe('New Name');
    });
  });

  describe('PATCH /api/v1/users/me/settings', () => {
    it('updates settings and returns 200', async () => {
      vi.mocked(userService.updateSettings).mockResolvedValueOnce({
        theme: 'dark',
        notifications: { general: true },
      } as any);

      const res = await fetch(`${baseUrl}/api/v1/users/me/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ theme: 'dark' }),
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.settings.theme).toBe('dark');
    });
  });

  describe('POST /api/v1/users/me/onboarding/complete', () => {
    it('marks onboarding complete and returns 200', async () => {
      vi.mocked(userService.completeOnboarding).mockResolvedValueOnce({
        _id: 'u1',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        dateOfBirth: null,
        sex: null,
        heightCm: null,
        timezone: 'UTC',
        locale: 'en-US',
        units: 'metric',
        goals: null,
        onboardingCompletedAt: new Date('2026-01-01T00:00:00.000Z'),
        status: 'active',
        authProviders: [],
      } as any);

      const res = await fetch(`${baseUrl}/api/v1/users/me/onboarding/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.user.onboardingCompletedAt).toBe('2026-01-01T00:00:00.000Z');
    });
  });
});
