import { Router } from 'express';
import { habitController } from '../controller/habitController.js';
import { authMiddleware } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import { asyncHandler } from '../../../middleware/asyncHandler.js';
import {
  createHabitSchema,
  updateHabitSchema,
  logCompletionSchema,
  listHabitsQuerySchema,
  listLogsQuerySchema,
} from '../schema/habitSchema.js';

const router = Router();

router.post('/', authMiddleware, validate(createHabitSchema), asyncHandler(habitController.create.bind(habitController)));
router.get('/', authMiddleware, validate(listHabitsQuerySchema), asyncHandler(habitController.list.bind(habitController)));
router.get('/:id', authMiddleware, asyncHandler(habitController.getOne.bind(habitController)));
router.patch('/:id', authMiddleware, validate(updateHabitSchema), asyncHandler(habitController.update.bind(habitController)));
router.delete('/:id', authMiddleware, asyncHandler(habitController.archive.bind(habitController)));

router.post('/:id/logs', authMiddleware, validate(logCompletionSchema), asyncHandler(habitController.logCompletion.bind(habitController)));
router.get('/:id/logs', authMiddleware, validate(listLogsQuerySchema), asyncHandler(habitController.listLogs.bind(habitController)));
router.delete('/:id/logs/:date', authMiddleware, asyncHandler(habitController.undoLog.bind(habitController)));

export default router;
