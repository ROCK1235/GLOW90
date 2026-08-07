import { UserModel, IUser, UserSettingsModel, IUserSettings } from '../../users/model/index.js';
import { RefreshTokenModel, IRefreshToken } from '../model/RefreshToken.js';
import { UpdateQuery } from 'mongoose';

export class AuthRepository {
  async createUser(userData: Partial<IUser>): Promise<IUser> {
    return UserModel.create(userData);
  }

  async findUserByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findUserById(userId: string): Promise<IUser | null> {
    return UserModel.findById(userId).exec();
  }

  async updateUser(userId: string, update: UpdateQuery<IUser>): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(userId, update, { new: true }).exec();
  }

  async deleteUser(userId: string): Promise<void> {
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

  async createRefreshToken(tokenData: Partial<IRefreshToken>): Promise<IRefreshToken> {
    return RefreshTokenModel.create(tokenData);
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<IRefreshToken | null> {
    return RefreshTokenModel.findOne({ tokenHash, revokedAt: null, expiresAt: { $gt: new Date() } }).exec();
  }

  async revokeRefreshToken(tokenHash: string, replacedBy: string): Promise<void> {
    await RefreshTokenModel.findOneAndUpdate(
      { tokenHash },
      { revokedAt: new Date(), replacedBy }
    ).exec();
  }

  async revokeTokenFamily(userId: string, family: string): Promise<void> {
    await RefreshTokenModel.updateMany(
      { userId, family, revokedAt: null },
      { revokedAt: new Date() }
    ).exec();
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await RefreshTokenModel.updateMany(
      { userId, revokedAt: null },
      { revokedAt: new Date() }
    ).exec();
  }

  async findValidRefreshTokens(userId: string): Promise<IRefreshToken[]> {
    return RefreshTokenModel.find({ userId, revokedAt: null, expiresAt: { $gt: new Date() } }).exec();
  }
}

export const authRepository = new AuthRepository();