import { UpdateQuery } from 'mongoose';
import { ISkincareLog, ISkincareRoutine, SkincareLogModel, SkincareRoutineModel } from '../model/index.js';

export class SkincareRepository {
  async create(data: Partial<ISkincareRoutine>): Promise<ISkincareRoutine> {
    return SkincareRoutineModel.create(data);
  }

  async findById(routineId: string): Promise<ISkincareRoutine | null> {
    return SkincareRoutineModel.findById(routineId).exec();
  }

  async findByUser(userId: string, includeArchived: boolean): Promise<ISkincareRoutine[]> {
    const filter: Record<string, unknown> = { userId };
    if (!includeArchived) filter.isActive = true;
    return SkincareRoutineModel.find(filter).sort({ createdAt: 1 }).exec();
  }

  async update(routineId: string, update: UpdateQuery<ISkincareRoutine>): Promise<ISkincareRoutine | null> {
    return SkincareRoutineModel.findByIdAndUpdate(routineId, update, { new: true }).exec();
  }

  async archive(routineId: string): Promise<ISkincareRoutine | null> {
    return SkincareRoutineModel.findByIdAndUpdate(
      routineId,
      { isActive: false, archivedAt: new Date() },
      { new: true }
    ).exec();
  }

  async findLog(routineId: string, date: string): Promise<ISkincareLog | null> {
    return SkincareLogModel.findOne({ routineId, date }).exec();
  }

  async upsertLog(routineId: string, date: string, data: Partial<ISkincareLog>): Promise<ISkincareLog> {
    const log = await SkincareLogModel.findOneAndUpdate(
      { routineId, date },
      { $set: data },
      { new: true, upsert: true }
    ).exec();
    return log!;
  }

  async deleteLog(routineId: string, date: string): Promise<void> {
    await SkincareLogModel.deleteOne({ routineId, date }).exec();
  }

  async findLogsInRange(routineId: string, fromDate: string, toDate: string): Promise<ISkincareLog[]> {
    return SkincareLogModel.find({ routineId, date: { $gte: fromDate, $lte: toDate } })
      .sort({ date: -1 })
      .exec();
  }
}

export const skincareRepository = new SkincareRepository();
