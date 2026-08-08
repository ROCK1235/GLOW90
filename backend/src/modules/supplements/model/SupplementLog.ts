import mongoose, { Schema } from 'mongoose';
import { IUserOwnedDocument } from '../../../common/interfaces/index.js';

export interface ISupplementLog extends IUserOwnedDocument {
  supplementId: mongoose.Types.ObjectId;
  date: string;
  time: string;
  takenAt: Date;
}

const SupplementLogSchema = new Schema<ISupplementLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    supplementId: { type: Schema.Types.ObjectId, ref: 'Supplement', required: true, index: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    takenAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

SupplementLogSchema.index({ supplementId: 1, date: 1, time: 1 }, { unique: true });

export const SupplementLogModel = mongoose.model<ISupplementLog>('SupplementLog', SupplementLogSchema);
