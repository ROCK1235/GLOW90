import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';
import { logger } from '../config/logger.js';

export interface AuthPayload {
  userId: string;
  email?: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } });
    return;
  }

  const token = authHeader.slice(7);
  const { JWT_ACCESS_SECRET } = getEnv();

  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Access token expired' } });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid access token' } });
      return;
    }
    logger.error({ error }, 'Auth middleware error');
    res.status(500).json({ success: false, error: { code: 'AUTH_ERROR', message: 'Authentication failed' } });
  }
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);
  const { JWT_ACCESS_SECRET } = getEnv();

  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET) as AuthPayload;
    req.user = payload;
  } catch {
    // Ignore errors for optional auth
  }
  next();
}