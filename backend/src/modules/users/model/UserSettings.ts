import mongoose, { Schema } from 'mongoose';
import { IUserOwnedDocument } from '../../../common/interfaces/index.js';

export interface IUserSettings extends IUserOwnedDocument {
  theme: 'system' | 'light' | 'dark';
  notifications: {
    general: boolean;
  };
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    theme: { type: String, enum: ['system', 'light', 'dark'], required: true, default: 'system' },
    notifications: {
      general: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const UserSettingsModel = mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
