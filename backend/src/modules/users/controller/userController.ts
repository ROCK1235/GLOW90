import { Request, Response } from 'express';
import { userService } from '../service/userService.js';
import { IUser, IUserSettings } from '../model/index.js';

function toPublicUser(user: IUser) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    phoneNumber: user.phoneNumber,
    dateOfBirth: user.dateOfBirth,
    sex: user.sex,
    heightCm: user.heightCm,
    timezone: user.timezone,
    locale: user.locale,
    units: user.units,
    goals: user.goals,
    onboardingCompletedAt: user.onboardingCompletedAt,
    status: user.status,
    authProviders: user.authProviders.map((p) => p.provider),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toPublicSettings(settings: IUserSettings) {
  return {
    theme: settings.theme,
    notifications: settings.notifications,
    hydration: settings.hydration,
  };
}

export class UserController {
  async getMe(req: Request, res: Response): Promise<void> {
    const { user, settings } = await userService.getProfile(req.user!.userId);

    res.json({
      success: true,
      data: { user: toPublicUser(user), settings: toPublicSettings(settings) },
    });
  }

  async updateMe(req: Request, res: Response): Promise<void> {
    const user = await userService.updateProfile(req.user!.userId, req.body);

    res.json({
      success: true,
      data: { user: toPublicUser(user) },
    });
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    const settings = await userService.updateSettings(req.user!.userId, req.body);

    res.json({
      success: true,
      data: { settings: toPublicSettings(settings) },
    });
  }

  async completeOnboarding(req: Request, res: Response): Promise<void> {
    const user = await userService.completeOnboarding(req.user!.userId);

    res.json({
      success: true,
      data: { user: toPublicUser(user) },
    });
  }
}

export const userController = new UserController();
