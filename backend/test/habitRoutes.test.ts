import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import http from 'http';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { habitService } from '../src/modules/habits/service/habitService.js';
import { getEnv } from '../src/config/env.js';

vi.mock('../src/modules/habits/service/habitService.js');

describe('Habit Routes Integration Tests', () => {
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

  describe('POST /api/v1/habits', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await fetch(`${baseUrl}/api/v1/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Drink Water' }),
      });
      expect(res.status).toBe(401);
    });

    it('returns 422 for an empty name', async () => {
      const res = await fetch(`${baseUrl}/api/v1/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name: '' }),
      });
      expect(res.status).toBe(422);
    });

    it('creates a habit and returns 201', async () => {
      vi.mocked(habitService.createHabit).mockResolvedValueOnce({ _id: 'h1', name: 'Drink Water' } as any);

      const res = await fetch(`${baseUrl}/api/v1/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name: 'Drink Water', daysOfWeek: [1, 3, 5] }),
      });

      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.data.habit.name).toBe('Drink Water');
    });
  });

  describe('GET /api/v1/habits', () => {
    it('lists habits for the authenticated user', async () => {
      vi.mocked(habitService.listHabits).mockResolvedValueOnce([{ _id: 'h1' }, { _id: 'h2' }] as any);

      const res = await fetch(`${baseUrl}/api/v1/habits`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.habits).toHaveLength(2);
      expect(habitService.listHabits).toHaveBeenCalledWith('507f1f77bcf86cd799439011', false);
    });
  });

  describe('GET /api/v1/habits/:id', () => {
    it('returns 404 when the habit is not found', async () => {
      vi.mocked(habitService.getHabit).mockRejectedValueOnce(new Error('HABIT_NOT_FOUND'));

      const res = await fetch(`${baseUrl}/api/v1/habits/does-not-exist`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/habits/:id', () => {
    it('returns 422 for an unknown field', async () => {
      const res = await fetch(`${baseUrl}/api/v1/habits/h1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ notAField: true }),
      });
      expect(res.status).toBe(422);
    });

    it('updates the habit', async () => {
      vi.mocked(habitService.updateHabit).mockResolvedValueOnce({ _id: 'h1', name: 'Updated' } as any);

      const res = await fetch(`${baseUrl}/api/v1/habits/h1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name: 'Updated' }),
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.habit.name).toBe('Updated');
    });
  });

  describe('DELETE /api/v1/habits/:id', () => {
    it('archives the habit', async () => {
      vi.mocked(habitService.archiveHabit).mockResolvedValueOnce({ _id: 'h1', isActive: false } as any);

      const res = await fetch(`${baseUrl}/api/v1/habits/h1`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.habit.isActive).toBe(false);
    });
  });

  describe('POST /api/v1/habits/:id/logs', () => {
    it('returns 422 for a malformed date', async () => {
      const res = await fetch(`${baseUrl}/api/v1/habits/h1/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ date: '08-08-2026' }),
      });
      expect(res.status).toBe(422);
    });

    it('logs a completion and returns 201', async () => {
      vi.mocked(habitService.logCompletion).mockResolvedValueOnce({
        habit: { _id: 'h1', currentStreak: 1 } as any,
        alreadyLogged: false,
      });

      const res = await fetch(`${baseUrl}/api/v1/habits/h1/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ date: '2026-08-08' }),
      });

      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.data.habit.currentStreak).toBe(1);
      expect(body.data.alreadyLogged).toBe(false);
    });

    it('returns 200 when already logged for that date', async () => {
      vi.mocked(habitService.logCompletion).mockResolvedValueOnce({
        habit: { _id: 'h1', currentStreak: 1 } as any,
        alreadyLogged: true,
      });

      const res = await fetch(`${baseUrl}/api/v1/habits/h1/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/v1/habits/:id/logs/:date', () => {
    it('undoes a completion', async () => {
      vi.mocked(habitService.undoCompletion).mockResolvedValueOnce({ _id: 'h1', currentStreak: 0 } as any);

      const res = await fetch(`${baseUrl}/api/v1/habits/h1/logs/2026-08-08`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.habit.currentStreak).toBe(0);
      expect(habitService.undoCompletion).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'h1', '2026-08-08');
    });
  });

  describe('GET /api/v1/habits/:id/logs', () => {
    it('lists logs within a date range', async () => {
      vi.mocked(habitService.listLogs).mockResolvedValueOnce([{ date: '2026-08-08' }] as any);

      const res = await fetch(`${baseUrl}/api/v1/habits/h1/logs?from=2026-08-01&to=2026-08-08`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.logs).toHaveLength(1);
      expect(habitService.listLogs).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'h1', '2026-08-01', '2026-08-08');
    });
  });
});
