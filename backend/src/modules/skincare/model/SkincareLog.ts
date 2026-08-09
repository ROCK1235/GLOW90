import mongoose, { Schema } from 'mongoose';
import { IUserOwnedDocument } from '../../../common/interfaces/index.js';

export interface ISkincareLog extends IUserOwnedDocument {
  routineId: mongoose.Types.ObjectId;
  date: string;
  completedSteps: number[];
  totalSteps: number;
  isComplete: boolean;
  completedAt: Date;
}

const SkincareLogSchema = new Schema<ISkincareLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    routineId: { type: Schema.Types.ObjectId, ref: 'SkincareRoutine', required: true, index: true },
    date: { type: String, required: true },
    completedSteps: { type: [Number], default: [] },
    totalSteps: { type: Number, required: true, default: 0 },
    isComplete: { type: Boolean, required: true, default: false },
    completedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

SkincareLogSchema.index({ routineId: 1, date: 1 }, { unique: true });

export const SkincareLogModel = mongoose.model<ISkincareLog>('SkincareLog', SkincareLogSchema);
