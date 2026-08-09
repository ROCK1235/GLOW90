import { Router } from 'express';
import { userController } from '../controller/userController.js';
import { authMiddleware } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import { asyncHandler } from '../../../middleware/asyncHandler.js';
import { updateProfileSchema, updateSettingsSchema } from '../schema/userSchema.js';

const router = Router();

router.get('/me', authMiddleware, asyncHandler(userController.getMe.bind(userController)));
router.patch('/me', authMiddleware, validate(updateProfileSchema), asyncHandler(userController.updateMe.bind(userController)));
router.patch('/me/settings', authMiddleware, validate(updateSettingsSchema), asyncHandler(userController.updateSettings.bind(userController)));
router.post('/me/onboarding/complete', authMiddleware, asyncHandler(userController.completeOnboarding.bind(userController)));

export default router;
