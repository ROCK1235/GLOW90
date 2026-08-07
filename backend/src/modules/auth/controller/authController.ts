import { Request, Response } from 'express';
import { authService, RegisterData, LoginData } from '../service/authService.js';
import { logger } from '../../../config/logger.js';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const data: RegisterData = req.body;
    const result = await authService.register(data);

    logger.info({ userId: result.user._id }, 'User registered');

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.user._id,
          email: result.user.email,
          name: result.user.name,
          status: result.user.status,
        },
        settings: result.settings,
        tokens: result.tokens,
      },
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    const data: LoginData = {
      ...req.body,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    };

    const result = await authService.login(data);

    logger.info({ userId: result.user._id }, 'User logged in');

    res.json({
      success: true,
      data: {
        user: {
          id: result.user._id,
          email: result.user.email,
          name: result.user.name,
          status: result.user.status,
        },
        settings: result.settings,
        tokens: result.tokens,
      },
    });
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ success: false, error: { code: 'MISSING_REFRESH_TOKEN', message: 'Refresh token is required' } });
      return;
    }

    const tokens = await authService.refreshTokens(refreshToken, req.headers['user-agent'], req.ip);

    res.json({ success: true, data: { tokens } });
  }

  async logout(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    if (req.user) {
      logger.info({ userId: req.user.userId }, 'User logged out');
    }

    res.json({ success: true, data: { message: 'Logged out successfully' } });
  }

  async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: req.user.userId,
        },
      },
    });
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(req.user.userId, currentPassword, newPassword);

    logger.info({ userId: req.user.userId }, 'Password changed');

    res.json({ success: true, data: { message: 'Password changed successfully' } });
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    const resetToken = await authService.forgotPassword(email);

    if (resetToken) {
      logger.info({ email }, 'Password reset token generated');
    }

    res.json({
      success: true,
      data: { message: 'If the email exists, a reset link has been sent' },
    });
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword } = req.body;

    await authService.resetPassword(token, newPassword);

    logger.info('Password reset completed');

    res.json({ success: true, data: { message: 'Password reset successfully' } });
  }
}

export const authController = new AuthController();