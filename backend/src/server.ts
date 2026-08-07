import { loadEnv } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { logger } from './config/logger.js';
import { registerAllJobs, startJobs, stopJobs } from './jobs/index.js';
import { createApp } from './app.js';

async function bootstrap() {
  const env = loadEnv();

  await connectDB();
  logger.info('Database connected successfully');

  registerAllJobs();
  startJobs();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server started successfully');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down gracefully...');
    stopJobs();
    server.close(async () => {
      await disconnectDB();
      logger.info('Server shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  logger.error({ error }, 'Bootstrap failed');
  process.exit(1);
});
