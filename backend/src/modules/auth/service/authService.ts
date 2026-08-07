import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { randomUUID, createHash } from 'crypto';
import { getEnv } from '../../../config/env.js';
import { authRepository } from '../repository/authRepository.js';
import { IUser, IUserSettings } from '../../users/model/index.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  userAgent?: string;
  ip?: string;
}

export interface LoginData {
  email: string;
  password: string;
  userAgent?: string;
  ip?: string;
}

class AuthService {
  private generateTokenFamily(): string {
    return randomUUID();
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async register(data: RegisterData): Promise<{ user: IUser; settings: IUserSettings; tokens: TokenPair }> {
    const { email, password, name } = data;

    const existingUser = await authRepository.findUserByEmail(email);
    if (existingUser) {
      throw new Error('EMAIL_EXISTS');
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const family = this.generateTokenFamily();

    const user = await authRepository.createUser({
      email: email.toLowerCase(),
      passwordHash,
      name,
      status: 'active',
    });

    const settings = await authRepository.createSettings(user._id.toString());

    const tokens = await this.generateTokenPair(user._id.toString(), family, data.userAgent, data.ip);

    return { user, settings, tokens };
  }

  async login(data: LoginData): Promise<{ user: IUser; settings: IUserSettings; tokens: TokenPair }> {
    const { email, password, userAgent, ip } = data;

    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    if (user.status !== 'active') {
      throw new Error('ACCOUNT_SUSPENDED');
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const family = this.generateTokenFamily();
    const tokens = await this.generateTokenPair(user._id.toString(), family, userAgent, ip);

    const settings = await authRepository.findSettingsByUserId(user._id.toString());

    return { user, settings: settings!, tokens };
  }

  async refreshTokens(refreshToken: string, userAgent?: string, ip?: string): Promise<TokenPair> {
    const { JWT_REFRESH_SECRET } = getEnv();

    let payload: { userId: string; family: string; tokenVersion: number };
    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
    } catch {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    const storedToken = await authRepository.findRefreshTokenByHash(
      this.hashRefreshToken(refreshToken)
    );
    if (!storedToken || storedToken.family !== payload.family) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    if (storedToken.revokedAt) {
      await authRepository.revokeTokenFamily(payload.userId, payload.family);
      throw new Error('TOKEN_REUSED');
    }

    await authRepository.revokeRefreshToken(storedToken.tokenHash, randomUUID());

    const tokens = await this.generateTokenPair(payload.userId, payload.family, userAgent, ip);

    return tokens;
  }

  async logout(refreshToken: string): Promise<void> {
    const { JWT_REFRESH_SECRET } = getEnv();

    let payload: { userId: string; family: string };
    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
    } catch {
      return;
    }

    await authRepository.revokeTokenFamily(payload.userId, payload.family);
  }

  private async generateTokenPair(
    userId: string,
    family: string,
    userAgent?: string,
    ip?: string
  ): Promise<TokenPair> {
    const { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY } = getEnv();

    const accessToken = jwt.sign(
      { userId, tokenVersion: 1 },
      JWT_ACCESS_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRY as any }
    );

    const refreshToken = jwt.sign(
      { userId, family, tokenVersion: 1 },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRY as any }
    );

    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await authRepository.createRefreshToken({
      userId: new mongoose.Types.ObjectId(userId) as any,
      tokenHash: refreshTokenHash,
      family,
      expiresAt,
      userAgent: userAgent ?? null,
      ip: ip ?? null,
    });

    return { accessToken, refreshToken };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    const valid = await argon2.verify(user.passwordHash, currentPassword);
    if (!valid) throw new Error('INVALID_CURRENT_PASSWORD');

    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    await authRepository.updateUser(userId, { passwordHash });

    await authRepository.revokeAllUserTokens(userId);
  }

  async forgotPassword(email: string): Promise<string | null> {
    const user = await authRepository.findUserByEmail(email);
    if (!user) return null;

    const { JWT_REFRESH_SECRET } = getEnv();
    const resetToken = jwt.sign({ userId: user._id.toString(), type: 'password_reset' }, JWT_REFRESH_SECRET, {
      expiresIn: '30m',
    });

    return resetToken;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const { JWT_REFRESH_SECRET } = getEnv();

    let payload: { userId: string; type: string };
    try {
      payload = jwt.verify(token, JWT_REFRESH_SECRET) as any;
    } catch {
      throw new Error('INVALID_RESET_TOKEN');
    }

    if (payload.type !== 'password_reset') {
      throw new Error('INVALID_RESET_TOKEN');
    }

    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    await authRepository.updateUser(payload.userId, { passwordHash });
    await authRepository.revokeAllUserTokens(payload.userId);
  }
}

export const authService = new AuthService();