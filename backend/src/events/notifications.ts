import { eventBus, DomainEvents } from './bus.js';
import { logger } from '../config/logger.js';

interface NotificationPayload {
  userId: string;
  templateKey: string;
  payload: Record<string, unknown>;
  deepLink?: string;
}

async function scheduleNotification(payload: NotificationPayload): Promise<void> {
  // This is a stub - real implementation would:
  // 1. Fetch user's notification settings
  // 2. Check quiet hours
  // 3. Create notification document
  // 4. Schedule push via Expo/FCM
  logger.debug({ payload }, 'Scheduling notification');
}

eventBus.subscribe(DomainEvents.HABIT_LOGGED, async (payload: any) => {
  if (!payload?.userId) return;
  const { userId, habitId, streak } = payload;
  if (streak && streak > 1 && streak % 7 === 0) {
    await scheduleNotification({
      userId,
      templateKey: 'habit_streak_milestone',
      payload: { habitId, streak },
      deepLink: `glowtrack://habits/${habitId}`,
    });
  }
});

eventBus.subscribe(DomainEvents.WATER_GOAL_MET, async (payload: any) => {
  if (!payload?.userId) return;
  await scheduleNotification({
    userId: payload.userId,
    templateKey: 'water_goal_met',
    payload: {},
    deepLink: 'glowtrack://water',
  });
});

eventBus.subscribe(DomainEvents.WEIGHT_LOGGED, async (payload: any) => {
  if (!payload?.userId) return;
  await scheduleNotification({
    userId: payload.userId,
    templateKey: 'weight_logged',
    payload: {},
    deepLink: 'glowtrack://weight',
  });
});

eventBus.subscribe(DomainEvents.USER_REGISTERED, async (payload: any) => {
  if (!payload?.userId) return;
  await scheduleNotification({
    userId: payload.userId,
    templateKey: 'welcome',
    payload: {},
    deepLink: 'glowtrack://onboarding',
  });
});

logger.info('Notification subscribers registered');