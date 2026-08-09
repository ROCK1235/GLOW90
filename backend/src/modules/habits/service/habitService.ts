import { habitRepository } from '../repository/habitRepository.js';
import { IHabit, IHabitLog } from '../model/index.js';
import { eventBus, DomainEvents } from '../../../events/bus.js';
import { CreateHabitInput, UpdateHabitInput } from '../schema/habitSchema.js';
import { addDaysStr, computeCurrentStreak, isStreakBroken, previousDueDateStr, todayStr } from './streak.js';

const STREAK_LOOKBACK_DAYS = 400;

class HabitService {
  async createHabit(userId: string, data: CreateHabitInput): Promise<IHabit> {
    return habitRepository.create({
      userId: userId as any,
      name: data.name,
      icon: data.icon ?? null,
      cadence: { daysOfWeek: data.daysOfWeek ?? [] },
      reminderTime: data.reminderTime ?? null,
    });
  }

  async listHabits(userId: string, includeArchived: boolean): Promise<IHabit[]> {
    return habitRepository.findByUser(userId, includeArchived);
  }

  async getHabit(userId: string, habitId: string): Promise<IHabit> {
    const habit = await habitRepository.findById(habitId);
    if (!habit || habit.userId.toString() !== userId) {
      throw new Error('HABIT_NOT_FOUND');
    }
    return habit;
  }

  async updateHabit(userId: string, habitId: string, updates: UpdateHabitInput): Promise<IHabit> {
    const habit = await this.getHabit(userId, habitId);

    const { daysOfWeek, ...rest } = updates;
    const update: Record<string, unknown> = { ...rest };
    if (daysOfWeek !== undefined) {
      update.cadence = { daysOfWeek };
    }

    const updated = await habitRepository.update(habit._id.toString(), update);
    return updated!;
  }

  async archiveHabit(userId: string, habitId: string): Promise<IHabit> {
    const habit = await this.getHabit(userId, habitId);
    const archived = await habitRepository.archive(habit._id.toString());
    return archived!;
  }

  async logCompletion(
    userId: string,
    habitId: string,
    date?: string
  ): Promise<{ habit: IHabit; alreadyLogged: boolean }> {
    const habit = await this.getHabit(userId, habitId);
    const logDate = date ?? todayStr();

    const existing = await habitRepository.findLog(habit._id.toString(), logDate);
    if (existing) {
      return { habit, alreadyLogged: true };
    }

    await habitRepository.createLog({
      userId: habit.userId,
      habitId: habit._id,
      date: logDate,
      completedAt: new Date(),
    });

    const isConsecutive =
      habit.lastCompletedDate !== null &&
      previousDueDateStr(habit.cadence.daysOfWeek, logDate) === habit.lastCompletedDate;
    const isNewLatest = !habit.lastCompletedDate || logDate > habit.lastCompletedDate;

    const currentStreak = isConsecutive ? habit.currentStreak + 1 : isNewLatest ? 1 : habit.currentStreak;
    const longestStreak = Math.max(habit.longestStreak, currentStreak);
    const lastCompletedDate = isNewLatest ? logDate : habit.lastCompletedDate;
    const streakAdvanced = currentStreak > habit.currentStreak;

    const updated = await habitRepository.update(habit._id.toString(), {
      currentStreak,
      longestStreak,
      lastCompletedDate,
    });

    await eventBus.emit(DomainEvents.HABIT_LOGGED, {
      userId,
      habitId: habit._id.toString(),
      date: logDate,
      streak: currentStreak,
    });
    if (streakAdvanced) {
      await eventBus.emit(DomainEvents.HABIT_STREAK_ADVANCED, {
        userId,
        habitId: habit._id.toString(),
        streak: currentStreak,
      });
    }

    return { habit: updated!, alreadyLogged: false };
  }

  async undoCompletion(userId: string, habitId: string, date: string): Promise<IHabit> {
    const habit = await this.getHabit(userId, habitId);
    await habitRepository.deleteLog(habit._id.toString(), date);

    if (date !== habit.lastCompletedDate) {
      return habit;
    }

    const sinceDate = addDaysStr(date, -STREAK_LOOKBACK_DAYS);
    const recentDates = await habitRepository.findRecentLogDates(habit._id.toString(), sinceDate);

    const lastCompletedDate = recentDates[0] ?? null;
    const currentStreak = lastCompletedDate
      ? computeCurrentStreak(habit.cadence.daysOfWeek, new Set(recentDates), lastCompletedDate)
      : 0;

    const updated = await habitRepository.update(habit._id.toString(), { currentStreak, lastCompletedDate });
    return updated!;
  }

  async listLogs(userId: string, habitId: string, from?: string, to?: string): Promise<IHabitLog[]> {
    const habit = await this.getHabit(userId, habitId);
    const toDate = to ?? todayStr();
    const fromDate = from ?? addDaysStr(toDate, -30);
    return habitRepository.findLogsInRange(habit._id.toString(), fromDate, toDate);
  }

  async repairStreaks(): Promise<number> {
    const habits = await habitRepository.findActiveHabits();
    const today = todayStr();
    let repaired = 0;

    for (const habit of habits) {
      if (habit.currentStreak === 0 || !habit.lastCompletedDate) continue;

      if (isStreakBroken(habit.cadence.daysOfWeek, habit.lastCompletedDate, today)) {
        await habitRepository.update(habit._id.toString(), { currentStreak: 0 });
        repaired += 1;
      }
    }

    return repaired;
  }
}

export const habitService = new HabitService();
