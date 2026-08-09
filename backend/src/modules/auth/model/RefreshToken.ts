import mongoose, { Schema } from 'mongoose';
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

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    revokedAt: { type: Date, default: null },
    replacedBy: { type: String, default: null },
    userAgent: { type: String, default: null },
    ip: { type: String, default: null },
  },
  { timestamps: true }
);

RefreshTokenSchema.index({ userId: 1, family: 1 });

export const RefreshTokenModel = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);