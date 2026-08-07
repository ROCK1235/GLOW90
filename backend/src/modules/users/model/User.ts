import mongoose, { Schema } from 'mongoose';
import { IBaseDocument } from '../../../common/interfaces/index.js';

export interface IUser extends IBaseDocument {
  email: string;
  passwordHash: string;
  name: string;
  status: 'active' | 'suspended' | 'deleted';
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'suspended', 'deleted'], required: true, default: 'active' },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>('User', UserSchema);
