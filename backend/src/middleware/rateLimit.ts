import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { getEnv } from '../config/env.js';

let generalLimiterInstance: ReturnType<typeof rateLimit> | null = null;
let authLimiterInstance: ReturnType<typeof rateLimit> | null = null;

export function getGeneralRateLimiter() {
  if (!generalLimiterInstance) {
    const env = getEnv();
    generalLimiterInstance = rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
      validate: false,
      message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later' } },
      keyGenerator: (req) => req.ip ?? 'unknown',
    });
  }
  return generalLimiterInstance;
}

export function getAuthRateLimiter() {
  if (!authLimiterInstance) {
    const env = getEnv();
    authLimiterInstance = rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.AUTH_RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      validate: false,
      message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many authentication attempts, please try again later' } },
      keyGenerator: (req) => req.ip ?? 'unknown',
    });
  }
  return authLimiterInstance;
}

export const generalRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'test') return next();
  getGeneralRateLimiter()(req, res, next);
};

export const authRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'test') return next();
  getAuthRateLimiter()(req, res, next);
};