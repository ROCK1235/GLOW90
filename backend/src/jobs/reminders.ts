import { registerJob } from './scheduler.js';
import { logger } from '../config/logger.js';

export function registerReminderJob(): void {
  registerJob({
    name: 'reminder-scheduler',
    intervalMs: 15 * 60 * 1000, // Every 15 minutes
    handler: async () => {
      logger.debug('Running reminder scheduler');
      // TODO: Implement reminder scheduling logic
      // 1. Get current time buckets (15-min intervals)
      // 2. Find users whose timezone matches current bucket
      // 3. Check user reminder settings (habits, supplements, water)
      // 4. Send push notifications via Expo/FCM
      // 5. Record delivery to prevent double-notify on retry
    },
  });
}

export function registerStreakRepairJob(): void {
  registerJob({
    name: 'streak-repair',
    intervalMs: 24 * 60 * 60 * 1000, // Daily at midnight UTC
    handler: async () => {
      logger.debug('Running streak repair job');
      // TODO: Recompute streaks for users whose counters may have drifted
    },
  });
}

export function registerAnalyticsRollupJob(): void {
  registerJob({
    name: 'analytics-rollup',
    intervalMs: 60 * 60 * 1000, // Hourly
    handler: async () => {
      logger.debug('Running analytics rollup job');
      // TODO: Aggregate raw logs into AnalyticsRollups collection
    },
  });
}

export function registerAllJobs(): void {
  registerReminderJob();
  registerStreakRepairJob();
  registerAnalyticsRollupJob();
}