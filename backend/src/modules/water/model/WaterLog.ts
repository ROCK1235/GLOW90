import mongoose, { Schema } from 'mongoose';
import { IUserOwnedDocument } from '../../../common/interfaces/index.js';

export interface IWaterLog extends IUserOwnedDocument {
  date: string;
  amountMl: number;
  loggedAt: Date;
}

const WaterLogSchema = new Schema<IWaterLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true },
    amountMl: { type: Number, required: true, min: 1, max: 5000 },
    loggedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

WaterLogSchema.index({ userId: 1, date: 1 });

export const WaterLogModel = mongoose.model<IWaterLog>('WaterLog', WaterLogSchema);
