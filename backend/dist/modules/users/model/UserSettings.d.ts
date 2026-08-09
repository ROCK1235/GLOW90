import mongoose from 'mongoose';
import { IUserOwnedDocument } from '../../../common/interfaces/index.js';
export interface IUserSettings extends IUserOwnedDocument {
    theme: 'system' | 'light' | 'dark';
    notifications: {
        general: boolean;
    };
}
export declare const UserSettingsModel: mongoose.Model<IUserSettings, {}, {}, {}, mongoose.Document<unknown, {}, IUserSettings, {}, {}> & IUserSettings & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=UserSettings.d.ts.map