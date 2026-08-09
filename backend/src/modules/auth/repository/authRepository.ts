import { UpdateQuery } from 'mongoose';
import { IUser, IUserSettings } from '../../users/model/index.js';
import { userRepository } from '../../users/repository/userRepository.js';
import { RefreshTokenModel, IRefreshToken } from '../model/RefreshToken.js';

export class AuthRepository {
  async createUser(userData: Partial<IUser>): Promise<IUser> {
    return userRepository.create(userData);
  }

  async findUserByEmail(email: string): Promise<IUser | null> {
    return userRepository.findByEmail(email);
  }

  async findUserByProvider(provider: 'google' | 'apple', providerId: string): Promise<IUser | null> {
    return userRepository.findByProvider(provider, providerId);
  }

  async addProviderToUser(userId: string, provider: 'google' | 'apple', providerId: string): Promise<IUser | null> {
    return userRepository.addProvider(userId, provider, providerId);
  }

  async findUserById(userId: string): Promise<IUser | null> {
    return userRepository.findById(userId);
  }

  async updateUser(userId: string, update: UpdateQuery<IUser>): Promise<IUser | null> {
    return userRepository.update(userId, update);
  }

  async deleteUser(userId: string): Promise<void> {
    return userRepository.softDelete(userId);
  }

  async createSettings(userId: string): Promise<IUserSettings> {
    return userRepository.createSettings(userId);
  }

  async findSettingsByUserId(userId: string): Promise<IUserSettings | null> {
    return userRepository.findSettingsByUserId(userId);
  }

  async updateSettings(userId: string, update: UpdateQuery<IUserSettings>): Promise<IUserSettings | null> {
    return userRepository.updateSettings(userId, update);
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
