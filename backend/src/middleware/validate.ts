import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { logger } from '../config/logger.js';

export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        }));
        res.status(422).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details },
        });
        return;
      }
      logger.error({ error }, 'Validation middleware error');
      res.status(500).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed' } });
    }
  };
}