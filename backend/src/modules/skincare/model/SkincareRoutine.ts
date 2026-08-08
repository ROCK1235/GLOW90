import mongoose, { Schema } from 'mongoose';
import { IUserOwnedDocument } from '../../../common/interfaces/index.js';

export type SkincareTimeOfDay = 'AM' | 'PM' | 'anytime';

export interface ISkincareStep {
  order: number;
  name: string;
  product: string | null;
}

export interface ISkincareRoutine extends IUserOwnedDocument {
  name: string;
  timeOfDay: SkincareTimeOfDay;
  steps: ISkincareStep[];
  cadence: {
    daysOfWeek: number[];
  };
  isActive: boolean;
  archivedAt: Date | null;
}

const SkincareStepSchema = new Schema<ISkincareStep>(
  {
    order: { type: Number, required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    product: { type: String, default: null, maxlength: 100 },
  },
  { _id: false }
);

const SkincareRoutineSchema = new Schema<ISkincareRoutine>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    timeOfDay: { type: String, enum: ['AM', 'PM', 'anytime'], required: true, default: 'anytime' },
    steps: { type: [SkincareStepSchema], default: [] },
    cadence: {
      daysOfWeek: { type: [Number], default: [] },
    },
    isActive: { type: Boolean, required: true, default: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

SkincareRoutineSchema.index({ userId: 1, isActive: 1 });

export const SkincareRoutineModel = mongoose.model<ISkincareRoutine>('SkincareRoutine', SkincareRoutineSchema);
