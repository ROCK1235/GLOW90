import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getEnv } from './config/env.js';
import { generalRateLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/routes/authRoutes.js';
import userRoutes from './modules/users/routes/userRoutes.js';
import habitRoutes from './modules/habits/routes/habitRoutes.js';

export function createApp(): express.Application {
  const app = express();
  const env = getEnv();

  // Security & standard middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(generalRateLimiter);

  // Health check route
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/habits', habitRoutes);

  // 404 & Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
