import { apiClient } from './client';

export type DosageUnit = 'mg' | 'mcg' | 'g' | 'ml' | 'iu' | 'tablet' | 'capsule' | 'drop';
export type FoodTiming = 'before_food' | 'after_food' | 'with_food' | 'anytime';

export interface Supplement {
  _id: string;
  name: string;
  dosageAmount: number;
  dosageUnit: DosageUnit;
  foodTiming: FoodTiming;
  notes: string | null;
  schedule: { daysOfWeek: number[]; times: string[] };
  isActive: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplementInput {
  name: string;
  dosageAmount: number;
  dosageUnit: DosageUnit;
  foodTiming?: FoodTiming;
  daysOfWeek?: number[];
  times?: string[];
}

export interface LogDoseResult {
  supplement: Supplement;
  alreadyLogged: boolean;
}

export interface SupplementLog {
  _id: string;
  date: string;
  time: string;
  takenAt: string;
}

export async function listSupplements(includeArchived = false): Promise<Supplement[]> {
  const { data } = await apiClient.get('/supplements', { params: { includeArchived } });
  return data.data.supplements;
}

export async function createSupplement(input: SupplementInput): Promise<Supplement> {
  const { data } = await apiClient.post('/supplements', input);
  return data.data.supplement;
}

export async function updateSupplement(id: string, input: Partial<SupplementInput>): Promise<Supplement> {
  const { data } = await apiClient.patch(`/supplements/${id}`, input);
  return data.data.supplement;
}

export async function archiveSupplement(id: string): Promise<Supplement> {
  const { data } = await apiClient.delete(`/supplements/${id}`);
  return data.data.supplement;
}

export async function logDose(id: string, time?: string): Promise<LogDoseResult> {
  const { data } = await apiClient.post(`/supplements/${id}/logs`, time ? { time } : {});
  return data.data;
}

export async function listLogs(id: string, from: string, to: string): Promise<SupplementLog[]> {
  const { data } = await apiClient.get(`/supplements/${id}/logs`, { params: { from, to } });
  return data.data.logs;
}
