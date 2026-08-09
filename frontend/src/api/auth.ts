import { apiClient } from './client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  status: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  sex?: 'male' | 'female' | 'other' | null;
  heightCm?: number | null;
  goals?: {
    type: 'weight_loss' | 'muscle_gain' | 'maintenance';
    targetWeightKg: number | null;
    targetDate: string | null;
  } | null;
}

interface AuthResponseData {
  user: AuthUser;
  tokens: AuthTokens;
}

export async function registerRequest(email: string, password: string, name: string): Promise<AuthResponseData> {
  const { data } = await apiClient.post('/auth/register', { email, password, name });
  return data.data;
}

export async function loginRequest(email: string, password: string): Promise<AuthResponseData> {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data.data;
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}
