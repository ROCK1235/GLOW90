import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import http from 'http';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { waterService } from '../src/modules/water/service/waterService.js';
import { getEnv } from '../src/config/env.js';

vi.mock('../src/modules/water/service/waterService.js');

describe('Water Routes Integration Tests', () => {
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

  describe('POST /api/v1/water/logs', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await fetch(`${baseUrl}/api/v1/water/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountMl: 250 }),
      });
      expect(res.status).toBe(401);
    });

    it('returns 422 for a non-positive amount', async () => {
      const res = await fetch(`${baseUrl}/api/v1/water/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ amountMl: -50 }),
      });
      expect(res.status).toBe(422);
    });

    it('logs water and returns 201', async () => {
      vi.mocked(waterService.logWater).mockResolvedValueOnce({
        log: { _id: 'w1', amountMl: 250 } as any,
        date: '2026-08-08',
        totalMl: 250,
        goalMl: 2500,
        goalMet: false,
      });

      const res = await fetch(`${baseUrl}/api/v1/water/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ amountMl: 250, date: '2026-08-08' }),
      });

      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.data.totalMl).toBe(250);
      expect(body.data.goalMet).toBe(false);
    });
  });

  describe('DELETE /api/v1/water/logs/:logId', () => {
    it('returns 404 when the log is not owned/found', async () => {
      vi.mocked(waterService.undoLog).mockRejectedValueOnce(new Error('WATER_LOG_NOT_FOUND'));

      const res = await fetch(`${baseUrl}/api/v1/water/logs/does-not-exist`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(res.status).toBe(404);
    });

    it('deletes the log', async () => {
      vi.mocked(waterService.undoLog).mockResolvedValueOnce(undefined);

      const res = await fetch(`${baseUrl}/api/v1/water/logs/w1`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(res.status).toBe(200);
      expect(waterService.undoLog).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'w1');
    });
  });

  describe('GET /api/v1/water/summary', () => {
    it('returns the daily summary', async () => {
      vi.mocked(waterService.getDailySummary).mockResolvedValueOnce({
        date: '2026-08-08',
        totalMl: 1800,
        goalMl: 2500,
        goalMet: false,
        logs: [],
      });

      const res = await fetch(`${baseUrl}/api/v1/water/summary?date=2026-08-08`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.summary.totalMl).toBe(1800);
    });
  });

  describe('GET /api/v1/water/logs', () => {
    it('lists logs within a range', async () => {
      vi.mocked(waterService.listLogs).mockResolvedValueOnce([{ amountMl: 250 }] as any);

      const res = await fetch(`${baseUrl}/api/v1/water/logs?from=2026-08-01&to=2026-08-08`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.logs).toHaveLength(1);
    });
  });
});
