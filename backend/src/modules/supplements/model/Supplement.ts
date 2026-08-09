import mongoose, { Schema } from 'mongoose';
import { IUserOwnedDocument } from '../../../common/interfaces/index.js';

export type DosageUnit = 'mg' | 'mcg' | 'g' | 'ml' | 'iu' | 'tablet' | 'capsule' | 'drop';
export type FoodTiming = 'before_food' | 'after_food' | 'with_food' | 'anytime';

export interface ISupplementSchedule {
  daysOfWeek: number[];
  times: string[];
}

export interface ISupplement extends IUserOwnedDocument {
  name: string;
  dosageAmount: number;
  dosageUnit: DosageUnit;
  foodTiming: FoodTiming;
  notes: string | null;
  schedule: ISupplementSchedule;
  isActive: boolean;
  archivedAt: Date | null;
}

const SupplementSchema = new Schema<ISupplement>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    dosageAmount: { type: Number, required: true, min: 0 },
    dosageUnit: {
      type: String,
      enum: ['mg', 'mcg', 'g', 'ml', 'iu', 'tablet', 'capsule', 'drop'],
      required: true,
    },
    foodTiming: {
      type: String,
      enum: ['before_food', 'after_food', 'with_food', 'anytime'],
      required: true,
      default: 'anytime',
    },
    notes: { type: String, default: null, maxlength: 500 },
    schedule: {
      daysOfWeek: { type: [Number], default: [] },
      times: { type: [String], default: ['09:00'] },
    },
    isActive: { type: Boolean, required: true, default: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

SupplementSchema.index({ userId: 1, isActive: 1 });

export const SupplementModel = mongoose.model<ISupplement>('Supplement', SupplementSchema);
