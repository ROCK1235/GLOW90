import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import http from 'http';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { weightService } from '../src/modules/weight/service/weightService.js';
import { getEnv } from '../src/config/env.js';

vi.mock('../src/modules/weight/service/weightService.js');

describe('Weight Routes Integration Tests', () => {
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

  describe('POST /api/v1/weight/logs', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await fetch(`${baseUrl}/api/v1/weight/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weightKg: 70 }),
      });
      expect(res.status).toBe(401);
    });

    it('returns 422 for a non-positive weight', async () => {
      const res = await fetch(`${baseUrl}/api/v1/weight/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ weightKg: -5 }),
      });
      expect(res.status).toBe(422);
    });

    it('logs weight and returns 201', async () => {
      vi.mocked(weightService.logWeight).mockResolvedValueOnce({ _id: 'w1', weightKg: 70 } as any);

      const res = await fetch(`${baseUrl}/api/v1/weight/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ weightKg: 70, date: '2026-08-08' }),
      });

      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.data.log.weightKg).toBe(70);
    });
  });

  describe('GET /api/v1/weight/logs/latest', () => {
    it('returns 200 with log=null when nothing logged yet', async () => {
      vi.mocked(weightService.getLatest).mockResolvedValueOnce(null);

      const res = await fetch(`${baseUrl}/api/v1/weight/logs/latest`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.log).toBeNull();
    });

    it('returns the latest log', async () => {
      vi.mocked(weightService.getLatest).mockResolvedValueOnce({ weightKg: 70 } as any);

      const res = await fetch(`${baseUrl}/api/v1/weight/logs/latest`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await res.json();
      expect(body.data.log.weightKg).toBe(70);
    });
  });

  describe('DELETE /api/v1/weight/logs/:date', () => {
    it('deletes the entry for that date', async () => {
      vi.mocked(weightService.deleteLog).mockResolvedValueOnce(undefined);

      const res = await fetch(`${baseUrl}/api/v1/weight/logs/2026-08-08`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(res.status).toBe(200);
      expect(weightService.deleteLog).toHaveBeenCalledWith('507f1f77bcf86cd799439011', '2026-08-08');
    });
  });

  describe('GET /api/v1/weight/logs', () => {
    it('lists logs within a range', async () => {
      vi.mocked(weightService.listLogs).mockResolvedValueOnce([{ weightKg: 70 }] as any);

      const res = await fetch(`${baseUrl}/api/v1/weight/logs?from=2026-05-01&to=2026-08-08`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.logs).toHaveLength(1);
    });
  });
});
