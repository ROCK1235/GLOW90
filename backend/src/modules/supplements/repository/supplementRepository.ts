import { UpdateQuery } from 'mongoose';
import { ISupplement, ISupplementLog, SupplementLogModel, SupplementModel } from '../model/index.js';

export class SupplementRepository {
  async create(data: Partial<ISupplement>): Promise<ISupplement> {
    return SupplementModel.create(data);
  }

  async findById(supplementId: string): Promise<ISupplement | null> {
    return SupplementModel.findById(supplementId).exec();
  }

  async findByUser(userId: string, includeArchived: boolean): Promise<ISupplement[]> {
    const filter: Record<string, unknown> = { userId };
    if (!includeArchived) filter.isActive = true;
    return SupplementModel.find(filter).sort({ createdAt: 1 }).exec();
  }

  async update(supplementId: string, update: UpdateQuery<ISupplement>): Promise<ISupplement | null> {
    return SupplementModel.findByIdAndUpdate(supplementId, update, { new: true }).exec();
  }

  async archive(supplementId: string): Promise<ISupplement | null> {
    return SupplementModel.findByIdAndUpdate(
      supplementId,
      { isActive: false, archivedAt: new Date() },
      { new: true }
    ).exec();
  }

  async createLog(data: Partial<ISupplementLog>): Promise<ISupplementLog> {
    return SupplementLogModel.create(data);
  }

  async findLog(supplementId: string, date: string, time: string): Promise<ISupplementLog | null> {
    return SupplementLogModel.findOne({ supplementId, date, time }).exec();
  }

  async deleteLog(supplementId: string, date: string, time: string): Promise<void> {
    await SupplementLogModel.deleteOne({ supplementId, date, time }).exec();
  }

  async findLogsInRange(supplementId: string, fromDate: string, toDate: string): Promise<ISupplementLog[]> {
    return SupplementLogModel.find({ supplementId, date: { $gte: fromDate, $lte: toDate } })
      .sort({ date: -1, time: 1 })
      .exec();
  }

  async countLogsInRange(supplementId: string, fromDate: string, toDate: string): Promise<number> {
    return SupplementLogModel.countDocuments({ supplementId, date: { $gte: fromDate, $lte: toDate } }).exec();
  }
}

export const supplementRepository = new SupplementRepository();
