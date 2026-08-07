import mongoose from 'mongoose';
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
export declare const UserModel: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map