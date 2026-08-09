import { eventBus, DomainEvents } from './bus.js';
import { logger } from '../config/logger.js';

interface AchievementCondition {
  metric: 'consecutive_days' | 'total_count' | 'distinct_days_in_window' | 'value_threshold';
  scope: string;
  op: '>=' | '>' | '<=' | '<' | '==';
  value: number;
}

interface Achievement {
  slug: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  trigger: string;
  condition: AchievementCondition;
  isActive: boolean;
}

async function evaluateCondition(
  userId: string,
  condition: AchievementCondition
): Promise<{ met: boolean; progress: number }> {
  // This is a stub - real implementation would query log collections
  // For now, return not met with 0 progress
  return { met: false, progress: 0 };
}

async function checkAndUnlockAchievements(userId: string, trigger: string): Promise<void> {
  // In real implementation, fetch achievements matching trigger and evaluate
  logger.debug({ userId, trigger }, 'Checking achievements');
}

eventBus.subscribe(DomainEvents.HABIT_LOGGED, async (payload: any) => {
  if (!payload?.userId) return;
  await checkAndUnlockAchievements(payload.userId, DomainEvents.HABIT_LOGGED);
});

eventBus.subscribe(DomainEvents.HABIT_STREAK_ADVANCED, async (payload: any) => {
  if (!payload?.userId) return;
  await checkAndUnlockAchievements(payload.userId, DomainEvents.HABIT_STREAK_ADVANCED);
});

eventBus.subscribe(DomainEvents.WATER_GOAL_MET, async (payload: any) => {
  if (!payload?.userId) return;
  await checkAndUnlockAchievements(payload.userId, DomainEvents.WATER_GOAL_MET);
});

eventBus.subscribe(DomainEvents.WEIGHT_LOGGED, async (payload: any) => {
  if (!payload?.userId) return;
  await checkAndUnlockAchievements(payload.userId, DomainEvents.WEIGHT_LOGGED);
});

eventBus.subscribe(DomainEvents.SUPPLEMENT_TAKEN, async (payload: any) => {
  if (!payload?.userId) return;
  await checkAndUnlockAchievements(payload.userId, DomainEvents.SUPPLEMENT_TAKEN);
});

eventBus.subscribe(DomainEvents.WORKOUT_COMPLETED, async (payload: any) => {
  if (!payload?.userId) return;
  await checkAndUnlockAchievements(payload.userId, DomainEvents.WORKOUT_COMPLETED);
});

eventBus.subscribe(DomainEvents.USER_REGISTERED, async (payload: any) => {
  if (!payload?.userId) return;
  logger.info({ userId: payload.userId }, 'User registered, checking welcome achievements');
});

logger.info('Achievement subscribers registered');