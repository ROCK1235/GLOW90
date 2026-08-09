import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import http from 'http';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { supplementService } from '../src/modules/supplements/service/supplementService.js';
import { getEnv } from '../src/config/env.js';

vi.mock('../src/modules/supplements/service/supplementService.js');

describe('Supplement Routes Integration Tests', () => {
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

  describe('POST /api/v1/supplements', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await fetch(`${baseUrl}/api/v1/supplements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Vitamin D', dosageAmount: 1000, dosageUnit: 'iu' }),
      });
      expect(res.status).toBe(401);
    });

    it('returns 422 for an invalid dosage unit', async () => {
      const res = await fetch(`${baseUrl}/api/v1/supplements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name: 'Vitamin D', dosageAmount: 1000, dosageUnit: 'bananas' }),
      });
      expect(res.status).toBe(422);
    });

    it('creates a supplement and returns 201', async () => {
      vi.mocked(supplementService.createSupplement).mockResolvedValueOnce({ _id: 's1', name: 'Vitamin D' } as any);

      const res = await fetch(`${baseUrl}/api/v1/supplements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name: 'Vitamin D', dosageAmount: 1000, dosageUnit: 'iu', times: ['08:00', '20:00'] }),
      });

      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.data.supplement.name).toBe('Vitamin D');
    });
  });

  describe('GET /api/v1/supplements/:id', () => {
    it('returns 404 when not found', async () => {
      vi.mocked(supplementService.getSupplement).mockRejectedValueOnce(new Error('SUPPLEMENT_NOT_FOUND'));

      const res = await fetch(`${baseUrl}/api/v1/supplements/does-not-exist`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/supplements/:id/logs', () => {
    it('returns 422 for a malformed time', async () => {
      const res = await fetch(`${baseUrl}/api/v1/supplements/s1/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ time: '25:99' }),
      });
      expect(res.status).toBe(422);
    });

    it('logs a dose and returns 201', async () => {
      vi.mocked(supplementService.logDose).mockResolvedValueOnce({
        supplement: { _id: 's1' } as any,
        alreadyLogged: false,
      });

      const res = await fetch(`${baseUrl}/api/v1/supplements/s1/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ date: '2026-08-08', time: '09:00' }),
      });

      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.data.alreadyLogged).toBe(false);
    });

    it('returns 200 when already logged', async () => {
      vi.mocked(supplementService.logDose).mockResolvedValueOnce({
        supplement: { _id: 's1' } as any,
        alreadyLogged: true,
      });

      const res = await fetch(`${baseUrl}/api/v1/supplements/s1/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/v1/supplements/:id/logs/:date/:time', () => {
    it('undoes a dose log', async () => {
      vi.mocked(supplementService.undoDose).mockResolvedValueOnce(undefined);

      const res = await fetch(`${baseUrl}/api/v1/supplements/s1/logs/2026-08-08/09:00`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(res.status).toBe(200);
      expect(supplementService.undoDose).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 's1', '2026-08-08', '09:00');
    });
  });

  describe('GET /api/v1/supplements/:id/logs', () => {
    it('returns 422 when the date range exceeds 400 days', async () => {
      const res = await fetch(`${baseUrl}/api/v1/supplements/s1/logs?from=2020-01-01&to=2026-08-08`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(res.status).toBe(422);
    });

    it('lists logs within a valid range', async () => {
      vi.mocked(supplementService.listLogs).mockResolvedValueOnce([{ date: '2026-08-08', time: '09:00' }] as any);

      const res = await fetch(`${baseUrl}/api/v1/supplements/s1/logs?from=2026-08-01&to=2026-08-08`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.logs).toHaveLength(1);
    });
  });

  describe('GET /api/v1/supplements/:id/adherence', () => {
    it('returns adherence stats', async () => {
      vi.mocked(supplementService.getAdherence).mockResolvedValueOnce({
        from: '2026-08-01',
        to: '2026-08-08',
        expectedDoses: 8,
        takenDoses: 6,
        adherenceRate: 0.75,
      });

      const res = await fetch(`${baseUrl}/api/v1/supplements/s1/adherence?from=2026-08-01&to=2026-08-08`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.adherence.adherenceRate).toBe(0.75);
    });
  });
});
