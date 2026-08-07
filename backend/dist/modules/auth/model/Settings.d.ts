import mongoose from 'mongoose';
import { IBaseDocument } from '@glowtrack/shared';
export interface ISettings extends IBaseDocument {
    userId: mongoose.Types.ObjectId;
    theme: 'system' | 'light' | 'dark';
    notifications: {
        habits: {
            enabled: boolean;
            quietHours: {
                start: string;
                end: string;
            } | null;
        };
        water: {
            enabled: boolean;
            quietHours: {
                start: string;
                end: string;
            } | null;
        };
        supplements: {
            enabled: boolean;
            quietHours: {
                start: string;
                end: string;
            } | null;
        };
        workouts: {
            enabled: boolean;
            quietHours: {
                start: string;
                end: string;
            } | null;
        };
        weight: {
            enabled: boolean;
            quietHours: {
                start: string;
                end: string;
            } | null;
        };
        skincare: {
            enabled: boolean;
            quietHours: {
                start: string;
                end: string;
            } | null;
        };
        general: {
            enabled: boolean;
            quietHours: {
                start: string;
                end: string;
            } | null;
        };
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
export declare const SettingsModel: mongoose.Model<ISettings, {}, {}, {}, mongoose.Document<unknown, {}, ISettings, {}, {}> & ISettings & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Settings.d.ts.map