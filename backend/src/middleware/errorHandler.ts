import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { logger } from '../config/logger.js';

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  logger.error({ err, path: req.path, method: req.method }, 'Request error');

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
      code: 'VALIDATION_ERROR',
    }));
    res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details } });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid ID format' } });
    return;
  }

  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    res.status(409).json({ success: false, error: { code: 'DUPLICATE_ENTRY', message: `${field} already exists` } });
    return;
  }

  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
}