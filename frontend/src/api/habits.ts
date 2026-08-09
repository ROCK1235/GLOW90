import { apiClient } from './client';

export interface Habit {
  _id: string;
  name: string;
  icon: string | null;
  cadence: { daysOfWeek: number[] };
  reminderTime: string | null;
  isActive: boolean;
  archivedAt: string | null;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHabitInput {
  name: string;
  daysOfWeek?: number[];
  icon?: string | null;
  reminderTime?: string | null;
}

export interface UpdateHabitInput {
  name?: string;
  daysOfWeek?: number[];
  icon?: string | null;
  reminderTime?: string | null;
}

export interface LogCompletionResult {
  habit: Habit;
  alreadyLogged: boolean;
}

export async function listHabits(includeArchived = false): Promise<Habit[]> {
  const { data } = await apiClient.get('/habits', { params: { includeArchived } });
  return data.data.habits;
}

export async function createHabit(input: CreateHabitInput): Promise<Habit> {
  const { data } = await apiClient.post('/habits', input);
  return data.data.habit;
}

export async function updateHabit(habitId: string, input: UpdateHabitInput): Promise<Habit> {
  const { data } = await apiClient.patch(`/habits/${habitId}`, input);
  return data.data.habit;
}

export async function archiveHabit(habitId: string): Promise<Habit> {
  const { data } = await apiClient.delete(`/habits/${habitId}`);
  return data.data.habit;
}

export async function logHabitCompletion(habitId: string): Promise<LogCompletionResult> {
  const { data } = await apiClient.post(`/habits/${habitId}/logs`, {});
  return data.data;
}
