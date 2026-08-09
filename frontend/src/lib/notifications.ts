import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Habit } from '../api/habits';
import { Supplement } from '../api/supplements';
import { NotificationSettings } from './notificationSettings';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function getNotificationPermissionGranted(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

function parseTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

async function scheduleDaily(hour: number, minute: number, title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

interface ResyncParams {
  settings: NotificationSettings;
  habits: Habit[];
  supplements: Supplement[];
}

// Sync strategy: cancel everything, then reschedule fresh from current data.
// Simpler and more robust than hooking into every CRUD action across the
// habits/supplements slices — called from the settings screen on save, and
// once on app bootstrap if notifications were previously enabled.
//
// Per-day-of-week filtering is not implemented: every reminder repeats
// daily regardless of a supplement's/habit's `daysOfWeek` — most default to
// every day anyway, and cross-platform per-weekday local triggers add
// meaningfully more complexity for limited value here.
export async function resyncScheduledNotifications({ settings, habits, supplements }: ResyncParams): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.enabled) return;

  await ensureAndroidChannel();

  if (settings.supplementsEnabled) {
    for (const supplement of supplements) {
      for (const time of supplement.schedule.times) {
        const { hour, minute } = parseTime(time);
        await scheduleDaily(hour, minute, supplement.name, `${supplement.dosageAmount} ${supplement.dosageUnit}`);
      }
    }
  }

  if (settings.habitsEnabled) {
    for (const habit of habits) {
      if (!habit.reminderTime) continue;
      const { hour, minute } = parseTime(habit.reminderTime);
      await scheduleDaily(hour, minute, habit.name, "Don't forget your habit today.");
    }
  }

  if (settings.waterEnabled) {
    const { hour, minute } = parseTime(settings.waterReminderTime);
    await scheduleDaily(hour, minute, 'Stay hydrated', 'Log your water intake for today.');
  }
}
