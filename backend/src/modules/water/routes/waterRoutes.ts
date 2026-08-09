import { Router } from 'express';
import { waterController } from '../controller/waterController.js';
import { authMiddleware } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import { asyncHandler } from '../../../middleware/asyncHandler.js';
import { logWaterSchema, dateRangeQuerySchema, summaryQuerySchema } from '../schema/waterSchema.js';

const router = Router();

router.post('/logs', authMiddleware, validate(logWaterSchema), asyncHandler(waterController.logWater.bind(waterController)));
router.get('/logs', authMiddleware, validate(dateRangeQuerySchema), asyncHandler(waterController.listLogs.bind(waterController)));
router.delete('/logs/:logId', authMiddleware, asyncHandler(waterController.undoLog.bind(waterController)));

router.get('/summary', authMiddleware, validate(summaryQuerySchema), asyncHandler(waterController.getDailySummary.bind(waterController)));

export default router;
