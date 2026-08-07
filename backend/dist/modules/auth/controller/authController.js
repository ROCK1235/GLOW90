"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const authService_js_1 = require("../service/authService.js");
const logger_js_1 = require("../../../config/logger.js");
class AuthController {
    async register(req, res) {
        const data = req.body;
        const result = await authService_js_1.authService.register(data);
        logger_js_1.logger.info({ userId: result.user._id }, 'User registered');
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
    async login(req, res) {
        const data = {
            ...req.body,
            userAgent: req.headers['user-agent'],
            ip: req.ip,
        };
        const result = await authService_js_1.authService.login(data);
        logger_js_1.logger.info({ userId: result.user._id }, 'User logged in');
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
    async refresh(req, res) {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ success: false, error: { code: 'MISSING_REFRESH_TOKEN', message: 'Refresh token is required' } });
            return;
        }
        const tokens = await authService_js_1.authService.refreshTokens(refreshToken, req.headers['user-agent'], req.ip);
        res.json({ success: true, data: { tokens } });
    }
    async logout(req, res) {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await authService_js_1.authService.logout(refreshToken);
        }
        if (req.user) {
            logger_js_1.logger.info({ userId: req.user.userId }, 'User logged out');
        }
        res.json({ success: true, data: { message: 'Logged out successfully' } });
    }
    async me(req, res) {
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
    async changePassword(req, res) {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
            return;
        }
        const { currentPassword, newPassword } = req.body;
        await authService_js_1.authService.changePassword(req.user.userId, currentPassword, newPassword);
        logger_js_1.logger.info({ userId: req.user.userId }, 'Password changed');
        res.json({ success: true, data: { message: 'Password changed successfully' } });
    }
    async forgotPassword(req, res) {
        const { email } = req.body;
        const resetToken = await authService_js_1.authService.forgotPassword(email);
        if (resetToken) {
            logger_js_1.logger.info({ email }, 'Password reset token generated');
        }
        res.json({
            success: true,
            data: { message: 'If the email exists, a reset link has been sent' },
        });
    }
    async resetPassword(req, res) {
        const { token, newPassword } = req.body;
        await authService_js_1.authService.resetPassword(token, newPassword);
        logger_js_1.logger.info('Password reset completed');
        res.json({ success: true, data: { message: 'Password reset successfully' } });
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=authController.js.map