import mongoose, { Document, Schema } from 'mongoose';
import { IBaseDocument } from '@glowtrack/shared';

export interface ISettings extends IBaseDocument {
  userId: mongoose.Types.ObjectId;
  theme: 'system' | 'light' | 'dark';
  notifications: {
    habits: { enabled: boolean; quietHours: { start: string; end: string } | null };
    water: { enabled: boolean; quietHours: { start: string; end: string } | null };
    supplements: { enabled: boolean; quietHours: { start: string; end: string } | null };
    workouts: { enabled: boolean; quietHours: { start: string; end: string } | null };
    weight: { enabled: boolean; quietHours: { start: string; end: string } | null };
    skincare: { enabled: boolean; quietHours: { start: string; end: string } | null };
    general: { enabled: boolean; quietHours: { start: string; end: string } | null };
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showProgressPhotos: boolean;
    showWeight: boolean;
  };
  dashboardLayout: Array<{
    key: string;
    order: number;
    enabled: boolean;
    overrides: Record<string, unknown>;
  }>;
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  hydration: {
    mode: 'fixed' | 'by_weight';
    fixedMl: number;
    mlPerKg: number;
  };
}

const SettingsSchema = new Schema<ISettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    theme: { type: String, enum: ['system', 'light', 'dark'], required: true, default: 'system' },
    notifications: {
      habits: { enabled: { type: Boolean, default: true }, quietHours: { start: String, end: String } },
      water: { enabled: { type: Boolean, default: true }, quietHours: { start: String, end: String } },
      supplements: { enabled: { type: Boolean, default: true }, quietHours: { start: String, end: String } },
      workouts: { enabled: { type: Boolean, default: true }, quietHours: { start: String, end: String } },
      weight: { enabled: { type: Boolean, default: true }, quietHours: { start: String, end: String } },
      skincare: { enabled: { type: Boolean, default: true }, quietHours: { start: String, end: String } },
      general: { enabled: { type: Boolean, default: true }, quietHours: { start: String, end: String } },
    },
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'private' },
      showProgressPhotos: { type: Boolean, default: false },
      showWeight: { type: Boolean, default: false },
    },
    dashboardLayout: [
      {
        key: { type: String, required: true },
        order: { type: Number, required: true },
        enabled: { type: Boolean, default: true },
        overrides: { type: Schema.Types.Mixed, default: {} },
      },
    ],
    weekStartsOn: { type: Number, min: 0, max: 6, default: 0 },
    hydration: {
      mode: { type: String, enum: ['fixed', 'by_weight'], default: 'by_weight' },
      fixedMl: { type: Number, default: 2500 },
      mlPerKg: { type: Number, default: 35 },
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const SettingsModel = mongoose.model<ISettings>('Settings', SettingsSchema);