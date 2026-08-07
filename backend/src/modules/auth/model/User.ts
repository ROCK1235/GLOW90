import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from '../../../common/interfaces/index.js';

export interface IUser extends IBaseDocument {
  email: string;
  passwordHash: string;
  name: string;
  avatarUrl: string | null;
  dateOfBirth: Date | null;
  sex: 'male' | 'female' | 'other' | null;
  heightCm: number | null;
  timezone: string;
  locale: string;
  units: 'metric' | 'imperial';
  goals: {
    type: 'weight_loss' | 'muscle_gain' | 'maintenance';
    targetWeightKg: number | null;
    targetDate: Date | null;
  } | null;
  onboardingCompletedAt: Date | null;
  status: 'active' | 'suspended' | 'deleted';
  devices: Array<{
    expoPushToken: string;
    platform: 'ios' | 'android';
    lastSeenAt: Date;
  }>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: null },
    dateOfBirth: { type: Date, default: null },
    sex: { type: String, enum: ['male', 'female', 'other'], default: null },
    heightCm: { type: Number, default: null },
    timezone: { type: String, required: true, default: 'UTC' },
    locale: { type: String, required: true, default: 'en-US' },
    units: { type: String, enum: ['metric', 'imperial'], required: true, default: 'metric' },
    goals: {
      type: {
        type: String,
        enum: ['weight_loss', 'muscle_gain', 'maintenance'],
        default: null,
      },
      targetWeightKg: { type: Number, default: null },
      targetDate: { type: Date, default: null },
    },
    onboardingCompletedAt: { type: Date, default: null },
    status: { type: String, enum: ['active', 'suspended', 'deleted'], required: true, default: 'active' },
    devices: [
      {
        expoPushToken: { type: String, required: true },
        platform: { type: String, enum: ['ios', 'android'], required: true },
        lastSeenAt: { type: Date, required: true, default: Date.now },
      },
    ],
    //deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

export const UserModel = mongoose.model<IUser>('User', UserSchema);