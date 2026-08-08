import mongoose, { Schema } from 'mongoose';
import { IUserOwnedDocument } from '../../../common/interfaces/index.js';

export interface IBodyMeasurements {
  waistCm: number | null;
  chestCm: number | null;
  hipsCm: number | null;
  armsCm: number | null;
  thighsCm: number | null;
}

export interface IWeightLog extends IUserOwnedDocument {
  date: string;
  weightKg: number;
  bodyFatPercent: number | null;
  measurements: IBodyMeasurements | null;
  note: string | null;
  loggedAt: Date;
}

const BodyMeasurementsSchema = new Schema<IBodyMeasurements>(
  {
    waistCm: { type: Number, default: null },
    chestCm: { type: Number, default: null },
    hipsCm: { type: Number, default: null },
    armsCm: { type: Number, default: null },
    thighsCm: { type: Number, default: null },
  },
  { _id: false }
);

const WeightLogSchema = new Schema<IWeightLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true },
    weightKg: { type: Number, required: true, min: 0, max: 500 },
    bodyFatPercent: { type: Number, default: null, min: 0, max: 100 },
    measurements: { type: BodyMeasurementsSchema, default: null },
    note: { type: String, default: null, maxlength: 500 },
    loggedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

WeightLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const WeightLogModel = mongoose.model<IWeightLog>('WeightLog', WeightLogSchema);
