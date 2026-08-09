import { IWeightLog, WeightLogModel } from '../model/index.js';

export class WeightRepository {
  async upsertLog(userId: string, date: string, data: Partial<IWeightLog>): Promise<IWeightLog> {
    const log = await WeightLogModel.findOneAndUpdate(
      { userId, date },
      { $set: data },
      { new: true, upsert: true }
    ).exec();
    return log!;
  }

  async findByDate(userId: string, date: string): Promise<IWeightLog | null> {
    return WeightLogModel.findOne({ userId, date }).exec();
  }

  async findLatest(userId: string): Promise<IWeightLog | null> {
    return WeightLogModel.findOne({ userId }).sort({ date: -1 }).exec();
  }

  async deleteByDate(userId: string, date: string): Promise<void> {
    await WeightLogModel.deleteOne({ userId, date }).exec();
  }

  async findInRange(userId: string, fromDate: string, toDate: string): Promise<IWeightLog[]> {
    return WeightLogModel.find({ userId, date: { $gte: fromDate, $lte: toDate } })
      .sort({ date: -1 })
      .exec();
  }
}

export const weightRepository = new WeightRepository();
