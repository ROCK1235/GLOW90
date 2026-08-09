import * as SecureStore from 'expo-secure-store';

const SETTINGS_KEY = 'glowtrack_notification_settings';

export interface NotificationSettings {
  enabled: boolean;
  supplementsEnabled: boolean;
  habitsEnabled: boolean;
  waterEnabled: boolean;
  waterReminderTime: string; // HH:mm, 24h
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  supplementsEnabled: true,
  habitsEnabled: true,
  waterEnabled: true,
  waterReminderTime: '20:00',
};

// Local device preference (which reminder channels are on, and the water
// reminder time), not app data — doesn't need a backend round-trip, so it's
// persisted the same way auth tokens already are (expo-secure-store),
// rather than adding a new storage dependency.
export async function getNotificationSettings(): Promise<NotificationSettings> {
  const raw = await SecureStore.getItemAsync(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(settings));
}
