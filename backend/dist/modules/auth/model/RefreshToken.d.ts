import mongoose from 'mongoose';
import { IUserOwnedDocument } from '../../../common/interfaces/index.js';
export interface IRefreshToken extends IUserOwnedDocument {
    tokenHash: string;
    family: string;
    expiresAt: Date;
    revokedAt: Date | null;
    replacedBy: string | null;
    userAgent: string | null;
    ip: string | null;
}
export declare const RefreshTokenModel: mongoose.Model<IRefreshToken, {}, {}, {}, mongoose.Document<unknown, {}, IRefreshToken, {}, {}> & IRefreshToken & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=RefreshToken.d.ts.map