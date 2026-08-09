import { IWaterLog, WaterLogModel } from '../model/index.js';

export class WaterRepository {
  async create(data: Partial<IWaterLog>): Promise<IWaterLog> {
    return WaterLogModel.create(data);
  }

  async findOwnedLog(userId: string, logId: string): Promise<IWaterLog | null> {
    return WaterLogModel.findOne({ _id: logId, userId }).exec();
  }

  async deleteById(logId: string): Promise<void> {
    await WaterLogModel.deleteOne({ _id: logId }).exec();
  }

  async findByDate(userId: string, date: string): Promise<IWaterLog[]> {
    return WaterLogModel.find({ userId, date }).sort({ loggedAt: 1 }).exec();
  }

  async findInRange(userId: string, fromDate: string, toDate: string): Promise<IWaterLog[]> {
    return WaterLogModel.find({ userId, date: { $gte: fromDate, $lte: toDate } })
      .sort({ date: -1, loggedAt: 1 })
      .exec();
  }
}

export const waterRepository = new WaterRepository();
