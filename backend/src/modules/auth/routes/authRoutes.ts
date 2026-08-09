import { Router } from 'express';
import { authController } from '../controller/authController.js';
import { authMiddleware } from '../../../middleware/auth.js';
import { authRateLimiter } from '../../../middleware/rateLimit.js';
import { validate } from '../../../middleware/validate.js';
import { asyncHandler } from '../../../middleware/asyncHandler.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
  appleAuthSchema,
} from '../schema/authSchema.js';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), asyncHandler(authController.register.bind(authController)));
router.post('/login', authRateLimiter, validate(loginSchema), asyncHandler(authController.login.bind(authController)));
router.post('/refresh', authRateLimiter, validate(refreshSchema), asyncHandler(authController.refresh.bind(authController)));
router.post('/logout', validate(logoutSchema), asyncHandler(authController.logout.bind(authController)));

router.get('/me', authMiddleware, asyncHandler(authController.me.bind(authController)));
router.patch('/password', authMiddleware, validate(changePasswordSchema), asyncHandler(authController.changePassword.bind(authController)));

router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), asyncHandler(authController.forgotPassword.bind(authController)));
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), asyncHandler(authController.resetPassword.bind(authController)));

router.post('/google', authRateLimiter, validate(googleAuthSchema), asyncHandler(authController.google.bind(authController)));
router.post('/apple', authRateLimiter, validate(appleAuthSchema), asyncHandler(authController.apple.bind(authController)));

export default router;