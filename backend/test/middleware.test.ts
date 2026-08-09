import { describe, it, expect, beforeEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { z } from 'zod';
import { authMiddleware, optionalAuthMiddleware } from '../src/middleware/auth.js';
import { validate } from '../src/middleware/validate.js';
import { errorHandler, notFoundHandler, AppError } from '../src/middleware/errorHandler.js';
import { getEnv } from '../src/config/env.js';

describe('Middleware Suite', () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = 'supersecretaccesskey1234567890123';
    process.env.JWT_REFRESH_SECRET = 'supersecretrefreshkey123456789012';
  });

  describe('authMiddleware', () => {
    it('returns 401 when Authorization header is missing', () => {
      const req: any = { headers: {} };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when Bearer scheme is missing', () => {
      const req: any = { headers: { authorization: 'Basic 12345' } };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 for expired access token', () => {
      const secret = getEnv().JWT_ACCESS_SECRET;
      const expiredToken = jwt.sign({ userId: 'u1', tokenVersion: 1 }, secret, { expiresIn: '-1s' });
      const req: any = { headers: { authorization: `Bearer ${expiredToken}` } };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Access token expired' },
      });
    });

    it('returns 401 for invalid signature token', () => {
      const invalidToken = jwt.sign({ userId: 'u1' }, 'wrongsecretkey12345678901234567');
      const req: any = { headers: { authorization: `Bearer ${invalidToken}` } };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid access token' },
      });
    });

    it('populates req.user and calls next() for valid access token', () => {
      const secret = getEnv().JWT_ACCESS_SECRET;
      const validToken = jwt.sign({ userId: 'user_123', tokenVersion: 1 }, secret, { expiresIn: '1h' });
      const req: any = { headers: { authorization: `Bearer ${validToken}` } };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      authMiddleware(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe('user_123');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('proceeds without req.user when no header is present', () => {
      const req: any = { headers: {} };
      const res: any = {};
      const next = vi.fn();

      optionalAuthMiddleware(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('attaches req.user when valid header is present', () => {
      const secret = getEnv().JWT_ACCESS_SECRET;
      const validToken = jwt.sign({ userId: 'user_456', tokenVersion: 1 }, secret, { expiresIn: '1h' });
      const req: any = { headers: { authorization: `Bearer ${validToken}` } };
      const res: any = {};
      const next = vi.fn();

      optionalAuthMiddleware(req, res, next);

      expect(req.user?.userId).toBe('user_456');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('validate middleware', () => {
    const dummySchema = z.object({
      body: z.object({
        email: z.string().email(),
      }),
    });

    it('passes validation and calls next() on valid input', async () => {
      const req: any = { body: { email: 'test@example.com' }, query: {}, params: {} };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await validate(dummySchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns formatted 422 error on invalid input', async () => {
      const req: any = { body: { email: 'not-an-email' }, query: {}, params: {} };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await validate(dummySchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.arrayContaining([
              expect.objectContaining({ field: 'body.email' }),
            ]),
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('errorHandler middleware', () => {
    it('handles AppError correctly', () => {
      const err = new AppError('CUSTOM_ERR', 'Custom error message', 400);
      const req: any = { path: '/test', method: 'GET' };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'CUSTOM_ERR', message: 'Custom error message', details: undefined },
      });
    });

    it('handles Mongoose CastError', () => {
      const err = new mongoose.Error.CastError('ObjectId', 'invalid_id', 'id');
      const req: any = { path: '/test', method: 'GET' };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid ID format' },
      });
    });

    it('handles MongoServerError duplicate key error (11000)', () => {
      const err: any = new Error('Duplicate key');
      err.name = 'MongoServerError';
      err.code = 11000;
      err.keyValue = { email: 'existing@example.com' };

      const req: any = { path: '/test', method: 'POST' };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'DUPLICATE_ENTRY', message: 'email already exists' },
      });
    });

    it('handles unhandled generic errors with 500', () => {
      const err = new Error('Something broke');
      const req: any = { path: '/test', method: 'GET' };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    });
  });

  describe('notFoundHandler', () => {
    it('returns 404 with route info', () => {
      const req: any = { method: 'POST', path: '/api/v1/unknown' };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      notFoundHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Route POST /api/v1/unknown not found' },
      });
    });
  });
});
