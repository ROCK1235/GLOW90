import { Router } from 'express';
import { authController } from '../controller/authController.js';
import { authMiddleware } from '../../../middleware/auth.js';
import { authRateLimiter } from '../../../middleware/rateLimit.js';
import { validate } from '../../../middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schema/authSchema.js';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), authController.register.bind(authController));
router.post('/login', authRateLimiter, validate(loginSchema), authController.login.bind(authController));
router.post('/refresh', authRateLimiter, validate(refreshSchema), authController.refresh.bind(authController));
router.post('/logout', validate(logoutSchema), authController.logout.bind(authController));

router.get('/me', authMiddleware, authController.me.bind(authController));
router.patch('/password', authMiddleware, validate(changePasswordSchema), authController.changePassword.bind(authController));

router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword.bind(authController));
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword.bind(authController));

export default router;