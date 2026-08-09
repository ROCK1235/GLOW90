import { describe, it, expect, beforeEach, vi } from 'vitest';
import { userService } from '../src/modules/users/service/userService.js';
import { userRepository } from '../src/modules/users/repository/userRepository.js';

vi.mock('../src/modules/users/repository/userRepository.js');

const mockUserId = '507f1f77bcf86cd799439011';

describe('UserService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('throws USER_NOT_FOUND when the user does not exist', async () => {
      vi.mocked(userRepository.findById).mockResolvedValueOnce(null);

      await expect(userService.getProfile(mockUserId)).rejects.toThrow('USER_NOT_FOUND');
    });

    it('returns existing settings without creating new ones', async () => {
      vi.mocked(userRepository.findById).mockResolvedValueOnce({ _id: mockUserId } as any);
      vi.mocked(userRepository.findSettingsByUserId).mockResolvedValueOnce({ userId: mockUserId, theme: 'dark' } as any);

      const result = await userService.getProfile(mockUserId);

      expect(result.settings.theme).toBe('dark');
      expect(userRepository.createSettings).not.toHaveBeenCalled();
    });

    it('lazily creates settings when none exist yet', async () => {
      vi.mocked(userRepository.findById).mockResolvedValueOnce({ _id: mockUserId } as any);
      vi.mocked(userRepository.findSettingsByUserId).mockResolvedValueOnce(null);
      vi.mocked(userRepository.createSettings).mockResolvedValueOnce({ userId: mockUserId, theme: 'system' } as any);

      const result = await userService.getProfile(mockUserId);

      expect(userRepository.createSettings).toHaveBeenCalledWith(mockUserId);
      expect(result.settings.theme).toBe('system');
    });
  });

  describe('updateProfile', () => {
    it('throws USER_NOT_FOUND when updating a missing user', async () => {
      vi.mocked(userRepository.update).mockResolvedValueOnce(null);

      await expect(userService.updateProfile(mockUserId, { name: 'New Name' })).rejects.toThrow('USER_NOT_FOUND');
    });

    it('updates and returns the user', async () => {
      vi.mocked(userRepository.update).mockResolvedValueOnce({ _id: mockUserId, name: 'New Name' } as any);

      const user = await userService.updateProfile(mockUserId, { name: 'New Name' });

      expect(userRepository.update).toHaveBeenCalledWith(mockUserId, { name: 'New Name' });
      expect(user.name).toBe('New Name');
    });
  });

  describe('updateSettings', () => {
    it('updates and returns settings', async () => {
      vi.mocked(userRepository.updateSettings).mockResolvedValueOnce({ userId: mockUserId, theme: 'dark' } as any);

      const settings = await userService.updateSettings(mockUserId, { theme: 'dark' });

      expect(userRepository.updateSettings).toHaveBeenCalledWith(mockUserId, { theme: 'dark' });
      expect(settings.theme).toBe('dark');
    });
  });

  describe('completeOnboarding', () => {
    it('throws USER_NOT_FOUND when the user does not exist', async () => {
      vi.mocked(userRepository.update).mockResolvedValueOnce(null);

      await expect(userService.completeOnboarding(mockUserId)).rejects.toThrow('USER_NOT_FOUND');
    });

    it('sets onboardingCompletedAt to a Date', async () => {
      vi.mocked(userRepository.update).mockResolvedValueOnce({ _id: mockUserId, onboardingCompletedAt: new Date() } as any);

      const user = await userService.completeOnboarding(mockUserId);

      expect(userRepository.update).toHaveBeenCalledWith(mockUserId, { onboardingCompletedAt: expect.any(Date) });
      expect(user.onboardingCompletedAt).toBeInstanceOf(Date);
    });
  });
});
