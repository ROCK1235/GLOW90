import { Router } from 'express';
import { skincareController } from '../controller/skincareController.js';
import { authMiddleware } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import { asyncHandler } from '../../../middleware/asyncHandler.js';
import {
  createRoutineSchema,
  updateRoutineSchema,
  logRoutineSchema,
  listRoutinesQuerySchema,
  listLogsQuerySchema,
} from '../schema/skincareSchema.js';

const router = Router();

router.post('/routines', authMiddleware, validate(createRoutineSchema), asyncHandler(skincareController.create.bind(skincareController)));
router.get('/routines', authMiddleware, validate(listRoutinesQuerySchema), asyncHandler(skincareController.list.bind(skincareController)));
router.get('/routines/:id', authMiddleware, asyncHandler(skincareController.getOne.bind(skincareController)));
router.patch('/routines/:id', authMiddleware, validate(updateRoutineSchema), asyncHandler(skincareController.update.bind(skincareController)));
router.delete('/routines/:id', authMiddleware, asyncHandler(skincareController.archive.bind(skincareController)));

router.post('/routines/:id/logs', authMiddleware, validate(logRoutineSchema), asyncHandler(skincareController.logRoutine.bind(skincareController)));
router.get('/routines/:id/logs', authMiddleware, validate(listLogsQuerySchema), asyncHandler(skincareController.listLogs.bind(skincareController)));
router.delete('/routines/:id/logs/:date', authMiddleware, asyncHandler(skincareController.undoLog.bind(skincareController)));

export default router;
