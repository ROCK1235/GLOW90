import mongoose, { Schema } from 'mongoose';
import { IUserOwnedDocument } from '../../../common/interfaces/index.js';

export interface IUserSettings extends IUserOwnedDocument {
  theme: 'system' | 'light' | 'dark';
  notifications: {
    general: boolean;
  };
  hydration: {
    dailyGoalMl: number;
  };
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    theme: { type: String, enum: ['system', 'light', 'dark'], required: true, default: 'system' },
    notifications: {
      general: { type: Boolean, default: true },
    },
    hydration: {
      dailyGoalMl: { type: Number, required: true, default: 2500, min: 0 },
    },
  },
  { timestamps: true }
);

export const UserSettingsModel = mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
