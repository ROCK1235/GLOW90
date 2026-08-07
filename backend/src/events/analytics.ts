import { eventBus, DomainEvents } from './bus.js';
import { logger } from '../config/logger.js';

interface AnalyticsPayload {
  userId: string;
  module: string;
  metrics: Record<string, number>;
  period: 'day' | 'week' | 'month';
  periodKey: string;
}

async function updateAnalyticsRollup(payload: AnalyticsPayload): Promise<void> {
  // This is a stub - real implementation would upsert into AnalyticsRollups collection
  logger.debug({ payload }, 'Updating analytics rollup');
}

eventBus.subscribe(DomainEvents.HABIT_LOGGED, async (payload: any) => {
  if (!payload?.userId) return;
  await updateAnalyticsRollup({
    userId: payload.userId,
    module: 'habits',
    metrics: { completions: 1 },
    period: 'day',
    periodKey: new Date().toISOString().split('T')[0],
  });
});

eventBus.subscribe(DomainEvents.WATER_GOAL_MET, async (payload: any) => {
  if (!payload?.userId) return;
  await updateAnalyticsRollup({
    userId: payload.userId,
    module: 'water',
    metrics: { goalMet: 1 },
    period: 'day',
    periodKey: new Date().toISOString().split('T')[0],
  });
});

eventBus.subscribe(DomainEvents.WEIGHT_LOGGED, async (payload: any) => {
  if (!payload?.userId) return;
  await updateAnalyticsRollup({
    userId: payload.userId,
    module: 'weight',
    metrics: { weightKg: payload.weightKg ?? 0, logs: 1 },
    period: 'day',
    periodKey: new Date().toISOString().split('T')[0],
  });
});

eventBus.subscribe(DomainEvents.SUPPLEMENT_TAKEN, async (payload: any) => {
  if (!payload?.userId) return;
  await updateAnalyticsRollup({
    userId: payload.userId,
    module: 'supplements',
    metrics: { taken: 1 },
    period: 'day',
    periodKey: new Date().toISOString().split('T')[0],
  });
});

eventBus.subscribe(DomainEvents.WORKOUT_COMPLETED, async (payload: any) => {
  if (!payload?.userId) return;
  await updateAnalyticsRollup({
    userId: payload.userId,
    module: 'workouts',
    metrics: { volumeKg: payload.volumeKg ?? 0, sessions: 1 },
    period: 'day',
    periodKey: new Date().toISOString().split('T')[0],
  });
});

logger.info('Analytics subscribers registered');