import { apiClient } from './client';

export type SkincareTimeOfDay = 'AM' | 'PM' | 'anytime';

export interface SkincareStep {
  order: number;
  name: string;
  product: string | null;
}

export interface SkincareRoutine {
  _id: string;
  name: string;
  timeOfDay: SkincareTimeOfDay;
  steps: SkincareStep[];
  cadence: { daysOfWeek: number[] };
  isActive: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SkincareLog {
  _id: string;
  date: string;
  completedSteps: number[];
  totalSteps: number;
  isComplete: boolean;
  completedAt: string;
}

export interface RoutineStepInput {
  name: string;
  product?: string | null;
}

export interface RoutineInput {
  name: string;
  timeOfDay?: SkincareTimeOfDay;
  steps: RoutineStepInput[];
  daysOfWeek?: number[];
}

export interface LogProgressResult {
  routine: SkincareRoutine;
  log: SkincareLog;
  alreadyLogged: boolean;
}

export async function listRoutines(includeArchived = false): Promise<SkincareRoutine[]> {
  const { data } = await apiClient.get('/skincare/routines', { params: { includeArchived } });
  return data.data.routines;
}

export async function createRoutine(input: RoutineInput): Promise<SkincareRoutine> {
  const { data } = await apiClient.post('/skincare/routines', input);
  return data.data.routine;
}

export async function updateRoutine(id: string, input: Partial<RoutineInput>): Promise<SkincareRoutine> {
  const { data } = await apiClient.patch(`/skincare/routines/${id}`, input);
  return data.data.routine;
}

export async function archiveRoutine(id: string): Promise<SkincareRoutine> {
  const { data } = await apiClient.delete(`/skincare/routines/${id}`);
  return data.data.routine;
}

export async function logProgress(id: string, completedSteps: number[]): Promise<LogProgressResult> {
  const { data } = await apiClient.post(`/skincare/routines/${id}/logs`, { completedSteps });
  return data.data;
}

export async function listLogs(id: string, from: string, to: string): Promise<SkincareLog[]> {
  const { data } = await apiClient.get(`/skincare/routines/${id}/logs`, { params: { from, to } });
  return data.data.logs;
}
