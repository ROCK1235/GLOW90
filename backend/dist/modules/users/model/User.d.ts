import mongoose from 'mongoose';
import { IBaseDocument } from '../../../common/interfaces/index.js';
export interface IUser extends IBaseDocument {
    email: string;
    passwordHash: string;
    name: string;
    status: 'active' | 'suspended' | 'deleted';
}
export declare const UserModel: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map