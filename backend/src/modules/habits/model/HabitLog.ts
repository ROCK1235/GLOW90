import mongoose, { Schema } from 'mongoose';
import { IUserOwnedDocument } from '../../../common/interfaces/index.js';

export interface IHabitLog extends IUserOwnedDocument {
  habitId: mongoose.Types.ObjectId;
  date: string;
  completedAt: Date;
}

const HabitLogSchema = new Schema<IHabitLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    habitId: { type: Schema.Types.ObjectId, ref: 'Habit', required: true, index: true },
    date: { type: String, required: true },
    completedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

HabitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });

export const HabitLogModel = mongoose.model<IHabitLog>('HabitLog', HabitLogSchema);
