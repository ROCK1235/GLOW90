import { Types } from "mongoose";
import { IBaseDocument } from "./base.interface.js";

export interface IUserOwnedDocument extends IBaseDocument {
  userId: Types.ObjectId;
}