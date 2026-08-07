import { describe, it, expect, beforeEach, vi } from 'vitest';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { authService } from '../src/modules/auth/service/authService.js';
import { authRepository } from '../src/modules/auth/repository/authRepository.js';
import { getEnv } from '../src/config/env.js';

vi.mock('../src/modules/auth/repository/authRepository.js');

const mockUserId = '507f1f77bcf86cd799439011';

describe('AuthService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_ACCESS_SECRET = 'supersecretaccesskey1234567890123';
    process.env.JWT_REFRESH_SECRET = 'supersecretrefreshkey123456789012';
  });

  describe('register', () => {
    it('throws EMAIL_EXISTS if user already exists', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValueOnce({ _id: mockUserId } as any);

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'Password123!',
          name: 'Existing User',
        })
      ).rejects.toThrow('EMAIL_EXISTS');
    });

    it('creates user, settings, and returns tokens when email is available', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValueOnce(null);
      vi.mocked(authRepository.createUser).mockResolvedValueOnce({
        _id: mockUserId,
        email: 'new@example.com',
        name: 'New User',
        status: 'active',
      } as any);
      vi.mocked(authRepository.createSettings).mockResolvedValueOnce({ userId: mockUserId } as any);
      vi.mocked(authRepository.createRefreshToken).mockResolvedValueOnce({} as any);

      const result = await authService.register({
        email: 'new@example.com',
        password: 'Password123!',
        name: 'New User',
      });

      expect(result.user._id).toBe(mockUserId);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(authRepository.createSettings).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('login', () => {
    it('throws INVALID_CREDENTIALS if user is not found', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValueOnce(null);

      await expect(
        authService.login({ email: 'unknown@example.com', password: 'Password123!' })
      ).rejects.toThrow('INVALID_CREDENTIALS');
    });

    it('throws ACCOUNT_SUSPENDED if user is suspended', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValueOnce({
        _id: mockUserId,
        status: 'suspended',
      } as any);

      await expect(
        authService.login({ email: 'suspended@example.com', password: 'Password123!' })
      ).rejects.toThrow('ACCOUNT_SUSPENDED');
    });

    it('throws INVALID_CREDENTIALS if password verify fails', async () => {
      const hash = await argon2.hash('CorrectPassword123!', { type: argon2.argon2id });
      vi.mocked(authRepository.findUserByEmail).mockResolvedValueOnce({
        _id: mockUserId,
        passwordHash: hash,
        status: 'active',
      } as any);

      await expect(
        authService.login({ email: 'user@example.com', password: 'WrongPassword123!' })
      ).rejects.toThrow('INVALID_CREDENTIALS');
    });

    it('returns user, settings, and tokens on valid login credentials', async () => {
      const password = 'CorrectPassword123!';
      const hash = await argon2.hash(password, { type: argon2.argon2id });

      vi.mocked(authRepository.findUserByEmail).mockResolvedValueOnce({
        _id: mockUserId,
        passwordHash: hash,
        status: 'active',
      } as any);
      vi.mocked(authRepository.findSettingsByUserId).mockResolvedValueOnce({ theme: 'system' } as any);
      vi.mocked(authRepository.createRefreshToken).mockResolvedValueOnce({} as any);

      const result = await authService.login({ email: 'valid@example.com', password });

      expect(result.user._id).toBe(mockUserId);
      expect(result.tokens.accessToken).toBeDefined();
    });
  });

  describe('refreshTokens', () => {
    it('throws INVALID_REFRESH_TOKEN for malformed token', async () => {
      await expect(authService.refreshTokens('invalid.jwt.token')).rejects.toThrow('INVALID_REFRESH_TOKEN');
    });

    it('throws TOKEN_REUSED and revokes family if stored token is already revoked', async () => {
      const { JWT_REFRESH_SECRET } = getEnv();
      const family = 'fam_123';
      const refreshToken = jwt.sign({ userId: mockUserId, family, tokenVersion: 1 }, JWT_REFRESH_SECRET);

      const hash = authService.hashRefreshToken(refreshToken);
      vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValueOnce({
        tokenHash: hash,
        family,
        revokedAt: new Date(),
      } as any);

      await expect(authService.refreshTokens(refreshToken)).rejects.toThrow('TOKEN_REUSED');
      expect(authRepository.revokeTokenFamily).toHaveBeenCalledWith(mockUserId, family);
    });

    it('rotates tokens successfully when valid refresh token is supplied', async () => {
      const { JWT_REFRESH_SECRET } = getEnv();
      const family = 'fam_456';
      const refreshToken = jwt.sign({ userId: mockUserId, family, tokenVersion: 1 }, JWT_REFRESH_SECRET);

      const hash = authService.hashRefreshToken(refreshToken);
      vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValueOnce({
        tokenHash: hash,
        family,
        revokedAt: null,
      } as any);
      vi.mocked(authRepository.createRefreshToken).mockResolvedValueOnce({} as any);

      const newTokens = await authService.refreshTokens(refreshToken);

      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).toBeDefined();
      expect(authRepository.revokeRefreshToken).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('throws USER_NOT_FOUND if user does not exist', async () => {
      vi.mocked(authRepository.findUserById).mockResolvedValueOnce(null);

      await expect(authService.changePassword(mockUserId, 'oldPass', 'newPass123!')).rejects.toThrow('USER_NOT_FOUND');
    });

    it('throws INVALID_CURRENT_PASSWORD if current password check fails', async () => {
      const hash = await argon2.hash('RealPass123!', { type: argon2.argon2id });
      vi.mocked(authRepository.findUserById).mockResolvedValueOnce({
        _id: mockUserId,
        passwordHash: hash,
      } as any);

      await expect(authService.changePassword(mockUserId, 'WrongOldPass', 'NewPass123!')).rejects.toThrow('INVALID_CURRENT_PASSWORD');
    });

    it('updates password and revokes all user tokens when valid', async () => {
      const oldPass = 'OldPass123!';
      const hash = await argon2.hash(oldPass, { type: argon2.argon2id });
      vi.mocked(authRepository.findUserById).mockResolvedValueOnce({
        _id: mockUserId,
        passwordHash: hash,
      } as any);

      await authService.changePassword(mockUserId, oldPass, 'NewPassword123!');

      expect(authRepository.updateUser).toHaveBeenCalled();
      expect(authRepository.revokeAllUserTokens).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('forgotPassword & resetPassword', () => {
    it('returns null for non-existent email in forgotPassword', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValueOnce(null);

      const token = await authService.forgotPassword('unknown@example.com');
      expect(token).toBeNull();
    });

    it('returns reset token for existing user email', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValueOnce({
        _id: { toString: () => mockUserId },
      } as any);

      const token = await authService.forgotPassword('user@example.com');
      expect(token).toBeDefined();
    });

    it('throws INVALID_RESET_TOKEN if reset token is invalid or wrong payload type', async () => {
      const { JWT_REFRESH_SECRET } = getEnv();
      const wrongTypeToken = jwt.sign({ userId: mockUserId, type: 'other_type' }, JWT_REFRESH_SECRET);

      await expect(authService.resetPassword(wrongTypeToken, 'NewPass123!')).rejects.toThrow('INVALID_RESET_TOKEN');
    });

    it('resets password and revokes tokens when token payload is valid password_reset', async () => {
      const { JWT_REFRESH_SECRET } = getEnv();
      const resetToken = jwt.sign({ userId: mockUserId, type: 'password_reset' }, JWT_REFRESH_SECRET);

      await authService.resetPassword(resetToken, 'NewSecurePassword123!');

      expect(authRepository.updateUser).toHaveBeenCalledWith(mockUserId, expect.any(Object));
      expect(authRepository.revokeAllUserTokens).toHaveBeenCalledWith(mockUserId);
    });
  });
});
