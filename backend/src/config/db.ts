import mongoose from 'mongoose';
import { getEnv } from './env.js';
import { logger } from './logger.js';

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;

  const { MONGODB_URI } = getEnv();

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    logger.info({ uri: MONGODB_URI.replace(/\/\/.*@/, '//****:****@') }, 'MongoDB connected');
  } catch (error) {
    logger.error({ error }, 'MongoDB connection failed');
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}

export function getConnectionStatus(): boolean {
  return mongoose.connection.readyState === 1;
}