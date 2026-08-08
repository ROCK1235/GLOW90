import { UpdateQuery } from 'mongoose';
import { HabitModel, IHabit, HabitLogModel, IHabitLog } from '../model/index.js';

export class HabitRepository {
  async create(data: Partial<IHabit>): Promise<IHabit> {
    return HabitModel.create(data);
  }

  async findById(habitId: string): Promise<IHabit | null> {
    return HabitModel.findById(habitId).exec();
  }

  async findByUser(userId: string, includeArchived: boolean): Promise<IHabit[]> {
    const filter: Record<string, unknown> = { userId };
    if (!includeArchived) filter.isActive = true;
    return HabitModel.find(filter).sort({ createdAt: 1 }).exec();
  }

  async findActiveHabits(): Promise<IHabit[]> {
    return HabitModel.find({ isActive: true }).exec();
  }

  async update(habitId: string, update: UpdateQuery<IHabit>): Promise<IHabit | null> {
    return HabitModel.findByIdAndUpdate(habitId, update, { new: true }).exec();
  }

  async archive(habitId: string): Promise<IHabit | null> {
    return HabitModel.findByIdAndUpdate(
      habitId,
      { isActive: false, archivedAt: new Date() },
      { new: true }
    ).exec();
  }

  async createLog(data: Partial<IHabitLog>): Promise<IHabitLog> {
    return HabitLogModel.create(data);
  }

  async findLog(habitId: string, date: string): Promise<IHabitLog | null> {
    return HabitLogModel.findOne({ habitId, date }).exec();
  }

  async deleteLog(habitId: string, date: string): Promise<void> {
    await HabitLogModel.deleteOne({ habitId, date }).exec();
  }

  async findRecentLogDates(habitId: string, sinceDate: string): Promise<string[]> {
    const logs = await HabitLogModel.find({ habitId, date: { $gte: sinceDate } })
      .select('date')
      .sort({ date: -1 })
      .exec();
    return logs.map((log) => log.date);
  }

  async findLogsInRange(habitId: string, fromDate: string, toDate: string): Promise<IHabitLog[]> {
    return HabitLogModel.find({ habitId, date: { $gte: fromDate, $lte: toDate } })
      .sort({ date: -1 })
      .exec();
  }
}

export const habitRepository = new HabitRepository();
