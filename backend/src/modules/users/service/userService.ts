import { userRepository } from '../repository/userRepository.js';
import { IUser, IUserSettings } from '../model/index.js';
import { UpdateProfileInput, UpdateSettingsInput } from '../schema/userSchema.js';

class UserService {
  async getProfile(userId: string): Promise<{ user: IUser; settings: IUserSettings }> {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    let settings = await userRepository.findSettingsByUserId(userId);
    if (!settings) {
      settings = await userRepository.createSettings(userId);
    }

    return { user, settings };
  }

  async updateProfile(userId: string, updates: UpdateProfileInput): Promise<IUser> {
    const user = await userRepository.update(userId, updates);
    if (!user) throw new Error('USER_NOT_FOUND');
    return user;
  }

  async updateSettings(userId: string, updates: UpdateSettingsInput): Promise<IUserSettings> {
    const settings = await userRepository.updateSettings(userId, updates);
    return settings!;
  }

  async completeOnboarding(userId: string): Promise<IUser> {
    const user = await userRepository.update(userId, { onboardingCompletedAt: new Date() });
    if (!user) throw new Error('USER_NOT_FOUND');
    return user;
  }
}

export const userService = new UserService();
