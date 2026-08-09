import { Router } from 'express';
import { supplementController } from '../controller/supplementController.js';
import { authMiddleware } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import { asyncHandler } from '../../../middleware/asyncHandler.js';
import {
  createSupplementSchema,
  updateSupplementSchema,
  logDoseSchema,
  listSupplementsQuerySchema,
  dateRangeQuerySchema,
} from '../schema/supplementSchema.js';

const router = Router();

router.post('/', authMiddleware, validate(createSupplementSchema), asyncHandler(supplementController.create.bind(supplementController)));
router.get('/', authMiddleware, validate(listSupplementsQuerySchema), asyncHandler(supplementController.list.bind(supplementController)));
router.get('/:id', authMiddleware, asyncHandler(supplementController.getOne.bind(supplementController)));
router.patch('/:id', authMiddleware, validate(updateSupplementSchema), asyncHandler(supplementController.update.bind(supplementController)));
router.delete('/:id', authMiddleware, asyncHandler(supplementController.archive.bind(supplementController)));

router.post('/:id/logs', authMiddleware, validate(logDoseSchema), asyncHandler(supplementController.logDose.bind(supplementController)));
router.get('/:id/logs', authMiddleware, validate(dateRangeQuerySchema), asyncHandler(supplementController.listLogs.bind(supplementController)));
router.delete('/:id/logs/:date/:time', authMiddleware, asyncHandler(supplementController.undoDose.bind(supplementController)));

router.get('/:id/adherence', authMiddleware, validate(dateRangeQuerySchema), asyncHandler(supplementController.getAdherence.bind(supplementController)));

export default router;
