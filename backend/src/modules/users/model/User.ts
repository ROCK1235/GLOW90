import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from '../../../common/interfaces/index.js';

export interface IAuthProvider {
  provider: 'google' | 'apple';
  providerId: string;
}

export interface IUserGoals {
  type: 'weight_loss' | 'muscle_gain' | 'maintenance';
  targetWeightKg: number | null;
  targetDate: Date | null;
}

export interface IUser extends IBaseDocument {
  email: string;
  passwordHash: string | null;
  authProviders: IAuthProvider[];
  name: string;
  avatarUrl: string | null;
  dateOfBirth: Date | null;
  sex: 'male' | 'female' | 'other' | null;
  heightCm: number | null;
  timezone: string;
  locale: string;
  units: 'metric' | 'imperial';
  goals: IUserGoals | null;
  onboardingCompletedAt: Date | null;
  status: 'active' | 'suspended' | 'deleted';
}

const GoalsSchema = new Schema<IUserGoals>(
  {
    type: { type: String, enum: ['weight_loss', 'muscle_gain', 'maintenance'], required: true },
    targetWeightKg: { type: Number, default: null },
    targetDate: { type: Date, default: null },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null },
    authProviders: [
      {
        provider: { type: String, enum: ['google', 'apple'], required: true },
        providerId: { type: String, required: true },
        _id: false,
      },
    ],
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: null },
    dateOfBirth: { type: Date, default: null },
    sex: { type: String, enum: ['male', 'female', 'other'], default: null },
    heightCm: { type: Number, default: null },
    timezone: { type: String, required: true, default: 'UTC' },
    locale: { type: String, required: true, default: 'en-US' },
    units: { type: String, enum: ['metric', 'imperial'], required: true, default: 'metric' },
    goals: { type: GoalsSchema, default: null },
    onboardingCompletedAt: { type: Date, default: null },
    status: { type: String, enum: ['active', 'suspended', 'deleted'], required: true, default: 'active' },
  },
  { timestamps: true }
);

UserSchema.index(
  { 'authProviders.provider': 1, 'authProviders.providerId': 1 },
  { unique: true, sparse: true }
);

export const UserModel = mongoose.model<IUser>('User', UserSchema);
