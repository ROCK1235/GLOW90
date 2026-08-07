import { Types } from 'mongoose';

export interface IBaseDocument {
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
