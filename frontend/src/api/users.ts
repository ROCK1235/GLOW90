import { apiClient } from './client';
import { AuthUser } from './auth';

export interface UserSettings {
  theme: 'system' | 'light' | 'dark';
  notifications: { general: boolean };
  hydration: { dailyGoalMl: number };
}

interface ProfileResponseData {
  user: AuthUser;
  settings: UserSettings;
}

export async function getProfile(): Promise<ProfileResponseData> {
  const { data } = await apiClient.get('/users/me');
  return data.data;
}

export interface UpdateSettingsInput {
  theme?: 'system' | 'light' | 'dark';
  notifications?: { general?: boolean };
  hydration?: { dailyGoalMl?: number };
}

export async function updateSettings(input: UpdateSettingsInput): Promise<UserSettings> {
  const { data } = await apiClient.patch('/users/me/settings', input);
  return data.data.settings;
}

export interface UpdateProfileInput {
  name?: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  sex?: 'male' | 'female' | 'other' | null;
  heightCm?: number | null;
  goals?: {
    type: 'weight_loss' | 'muscle_gain' | 'maintenance';
    targetWeightKg?: number | null;
    targetDate?: string | null;
  } | null;
}

export async function updateProfile(input: UpdateProfileInput): Promise<AuthUser> {
  const { data } = await apiClient.patch('/users/me', input);
  return data.data.user;
}
