import pino from 'pino';
import { getEnv } from './env.js';

const { LOG_LEVEL } = getEnv();

export const logger = pino({
  level: LOG_LEVEL,
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
  } : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: undefined,
});

export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}