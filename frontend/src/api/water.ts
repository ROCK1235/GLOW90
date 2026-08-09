import { apiClient } from './client';

export interface WaterLog {
  _id: string;
  date: string;
  amountMl: number;
  loggedAt: string;
}

export interface WaterSummary {
  date: string;
  totalMl: number;
  goalMl: number;
  goalMet: boolean;
  logs: WaterLog[];
}

export interface LogWaterResult {
  log: WaterLog;
  date: string;
  totalMl: number;
  goalMl: number;
  goalMet: boolean;
}

export async function getSummary(date?: string): Promise<WaterSummary> {
  const { data } = await apiClient.get('/water/summary', { params: date ? { date } : {} });
  return data.data.summary;
}

export async function logWater(amountMl: number, date?: string): Promise<LogWaterResult> {
  const { data } = await apiClient.post('/water/logs', date ? { amountMl, date } : { amountMl });
  return data.data;
}

export async function deleteLog(logId: string): Promise<void> {
  await apiClient.delete(`/water/logs/${logId}`);
}
