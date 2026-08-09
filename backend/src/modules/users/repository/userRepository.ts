import { UpdateQuery } from 'mongoose';
import { UserModel, IUser, UserSettingsModel, IUserSettings } from '../model/index.js';

export class UserRepository {
  async create(userData: Partial<IUser>): Promise<IUser> {
    return UserModel.create(userData);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(userId: string): Promise<IUser | null> {
    return UserModel.findById(userId).exec();
  }

  async findByProvider(provider: 'google' | 'apple', providerId: string): Promise<IUser | null> {
    return UserModel.findOne({ authProviders: { $elemMatch: { provider, providerId } } }).exec();
  }

  async update(userId: string, update: UpdateQuery<IUser>): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(userId, update, { new: true }).exec();
  }

  async addProvider(userId: string, provider: 'google' | 'apple', providerId: string): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      { $addToSet: { authProviders: { provider, providerId } } },
      { new: true }
    ).exec();
  }

  async softDelete(userId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, { status: 'deleted' }).exec();
  }

  async createSettings(userId: string): Promise<IUserSettings> {
    return UserSettingsModel.create({ userId });
  }

  async findSettingsByUserId(userId: string): Promise<IUserSettings | null> {
    return UserSettingsModel.findOne({ userId }).exec();
  }

  async updateSettings(userId: string, update: UpdateQuery<IUserSettings>): Promise<IUserSettings | null> {
    return UserSettingsModel.findOneAndUpdate({ userId }, update, { new: true, upsert: true }).exec();
  }
}

export const userRepository = new UserRepository();
