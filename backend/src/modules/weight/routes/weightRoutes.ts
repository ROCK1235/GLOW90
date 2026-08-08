import { Router } from 'express';
import { weightController } from '../controller/weightController.js';
import { authMiddleware } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import { asyncHandler } from '../../../middleware/asyncHandler.js';
import { logWeightSchema, dateRangeQuerySchema } from '../schema/weightSchema.js';

const router = Router();

router.post('/logs', authMiddleware, validate(logWeightSchema), asyncHandler(weightController.logWeight.bind(weightController)));
router.get('/logs', authMiddleware, validate(dateRangeQuerySchema), asyncHandler(weightController.listLogs.bind(weightController)));
router.get('/logs/latest', authMiddleware, asyncHandler(weightController.getLatest.bind(weightController)));
router.delete('/logs/:date', authMiddleware, asyncHandler(weightController.deleteLog.bind(weightController)));

export default router;
