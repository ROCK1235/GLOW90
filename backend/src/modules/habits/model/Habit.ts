import mongoose, { Schema } from 'mongoose';
import { IUserOwnedDocument } from '../../../common/interfaces/index.js';

export interface IHabit extends IUserOwnedDocument {
  name: string;
  icon: string | null;
  cadence: {
    daysOfWeek: number[];
  };
  reminderTime: string | null;
  isActive: boolean;
  archivedAt: Date | null;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

const HabitSchema = new Schema<IHabit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    icon: { type: String, default: null },
    cadence: {
      daysOfWeek: { type: [Number], default: [] },
    },
    reminderTime: { type: String, default: null },
    isActive: { type: Boolean, required: true, default: true },
    archivedAt: { type: Date, default: null },
    currentStreak: { type: Number, required: true, default: 0 },
    longestStreak: { type: Number, required: true, default: 0 },
    lastCompletedDate: { type: String, default: null },
  },
  { timestamps: true }
);

HabitSchema.index({ userId: 1, isActive: 1 });

export const HabitModel = mongoose.model<IHabit>('Habit', HabitSchema);
