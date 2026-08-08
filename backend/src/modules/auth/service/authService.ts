import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import { randomUUID, createHash } from 'crypto';
import { getEnv } from '../../../config/env.js';
import { authRepository } from '../repository/authRepository.js';
import { IUser, IUserSettings } from '../../users/model/index.js';

type OAuthProvider = 'google' | 'apple';

interface OAuthIdentity {
  providerId: string;
  email: string | null;
  name?: string;
}

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

    const tokens = await this.generateTokenPair(user._id.toString(),email, family, data.userAgent, data.ip);

    return { user, settings, tokens };
  }


  //LOGIN
  
  async login(data: LoginData): Promise<{ user: IUser; settings: IUserSettings; tokens: TokenPair }> {
    const { email, password, userAgent, ip } = data;

    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    if (user.status !== 'active') {
      throw new Error('ACCOUNT_SUSPENDED');
    }

    if (!user.passwordHash) {
      throw new Error('OAUTH_ACCOUNT_NO_PASSWORD');
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const family = this.generateTokenFamily();
    const tokens = await this.generateTokenPair(user._id.toString(), user.email, family, userAgent, ip);

    const settings = await authRepository.findSettingsByUserId(user._id.toString());

    return { user, settings: settings!, tokens };
  }

  async refreshTokens(refreshToken: string, userAgent?: string, ip?: string): Promise<TokenPair> {
    const { JWT_REFRESH_SECRET } = getEnv();

    let payload: { userId: string; email: string; family: string; tokenVersion: number };
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

    const tokens = await this.generateTokenPair(payload.userId, payload.email, payload.family, userAgent, ip);

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

  private googleClient = new OAuth2Client();

  private async verifyGoogleToken(idToken: string): Promise<OAuthIdentity> {
    const { GOOGLE_CLIENT_IDS } = getEnv();
    const audiences = GOOGLE_CLIENT_IDS.split(',').map((id) => id.trim()).filter(Boolean);

    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: audiences.length ? audiences : undefined,
      });
      payload = ticket.getPayload();
    } catch {
      throw new Error('INVALID_GOOGLE_TOKEN');
    }

    if (!payload?.sub || payload.email_verified === false) {
      throw new Error('INVALID_GOOGLE_TOKEN');
    }

    return { providerId: payload.sub, email: payload.email ?? null, name: payload.name };
  }

  private async verifyAppleToken(idToken: string): Promise<OAuthIdentity> {
    const { APPLE_CLIENT_ID } = getEnv();

    let payload;
    try {
      payload = await appleSignin.verifyIdToken(idToken, {
        audience: APPLE_CLIENT_ID || undefined,
        ignoreExpiration: false,
      });
    } catch {
      throw new Error('INVALID_APPLE_TOKEN');
    }

    if (!payload?.sub) {
      throw new Error('INVALID_APPLE_TOKEN');
    }

    return { providerId: payload.sub, email: payload.email ?? null };
  }

  private async findOrCreateOAuthUser(
    provider: OAuthProvider,
    identity: OAuthIdentity,
    fallbackName: string | undefined,
    userAgent?: string,
    ip?: string
  ): Promise<{ user: IUser; settings: IUserSettings; tokens: TokenPair }> {
    let user = await authRepository.findUserByProvider(provider, identity.providerId);

    if (!user && identity.email) {
      const existingByEmail = await authRepository.findUserByEmail(identity.email);
      if (existingByEmail) {
        user = await authRepository.addProviderToUser(
          existingByEmail._id.toString(),
          provider,
          identity.providerId
        );
      }
    }

    if (!user) {
      if (!identity.email) {
        throw new Error('OAUTH_EMAIL_REQUIRED');
      }

      user = await authRepository.createUser({
        email: identity.email.toLowerCase(),
        passwordHash: null,
        name: identity.name || fallbackName || identity.email.split('@')[0],
        status: 'active',
        authProviders: [{ provider, providerId: identity.providerId }],
      });
      await authRepository.createSettings(user._id.toString());
    }

    if (user.status !== 'active') {
      throw new Error('ACCOUNT_SUSPENDED');
    }

    let settings = await authRepository.findSettingsByUserId(user._id.toString());
    if (!settings) {
      settings = await authRepository.createSettings(user._id.toString());
    }

    const family = this.generateTokenFamily();
    const tokens = await this.generateTokenPair(user._id.toString(), user.email, family, userAgent, ip);

    return { user, settings, tokens };
  }

  async loginWithGoogle(
    idToken: string,
    userAgent?: string,
    ip?: string
  ): Promise<{ user: IUser; settings: IUserSettings; tokens: TokenPair }> {
    const identity = await this.verifyGoogleToken(idToken);
    return this.findOrCreateOAuthUser('google', identity, undefined, userAgent, ip);
  }

  async loginWithApple(
    idToken: string,
    name: string | undefined,
    userAgent?: string,
    ip?: string
  ): Promise<{ user: IUser; settings: IUserSettings; tokens: TokenPair }> {
    const identity = await this.verifyAppleToken(idToken);
    return this.findOrCreateOAuthUser('apple', identity, name, userAgent, ip);
  }

  private async generateTokenPair(
    userId: string,
    email:string,
    family: string,
    userAgent?: string,
    ip?: string
  ): Promise<TokenPair> {
    const { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY } = getEnv();

    const accessToken = jwt.sign(
      { userId, email,tokenVersion: 1 },
      JWT_ACCESS_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRY as any }
    );

    const refreshToken = jwt.sign(
      { userId, email, family, tokenVersion: 1 },
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
    if (!user.passwordHash) throw new Error('OAUTH_ACCOUNT_NO_PASSWORD');

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