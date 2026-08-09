import { apiClient } from './client';

export interface WeightLog {
  _id: string;
  date: string;
  weightKg: number;
  bodyFatPercent: number | null;
  loggedAt: string;
}

export interface LogWeightInput {
  weightKg: number;
  date?: string;
}

export async function getLatestWeight(): Promise<WeightLog | null> {
  const { data } = await apiClient.get('/weight/logs/latest');
  return data.data.log;
}

export async function logWeight(input: LogWeightInput): Promise<WeightLog> {
  const { data } = await apiClient.post('/weight/logs', input);
  return data.data.log;
}

export async function listWeightLogs(from?: string, to?: string): Promise<WeightLog[]> {
  const { data } = await apiClient.get('/weight/logs', { params: { from, to } });
  return data.data.logs;
}

export async function deleteWeightLog(date: string): Promise<void> {
  await apiClient.delete(`/weight/logs/${date}`);
}
