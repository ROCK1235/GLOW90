import { describe, it, expect, beforeEach, vi } from 'vitest';
import { skincareService } from '../src/modules/skincare/service/skincareService.js';
import { skincareRepository } from '../src/modules/skincare/repository/skincareRepository.js';
import { eventBus, DomainEvents } from '../src/events/bus.js';

vi.mock('../src/modules/skincare/repository/skincareRepository.js');

const mockUserId = '507f1f77bcf86cd799439011';
const mockRoutineId = '507f1f77bcf86cd799439099';

function makeRoutine(overrides: Record<string, unknown> = {}) {
  return {
    _id: mockRoutineId,
    userId: mockUserId,
    name: 'Morning Routine',
    timeOfDay: 'AM',
    steps: [
      { order: 1, name: 'Cleanser', product: null },
      { order: 2, name: 'Moisturizer', product: null },
      { order: 3, name: 'SPF', product: null },
    ],
    cadence: { daysOfWeek: [] },
    isActive: true,
    ...overrides,
  } as any;
}

describe('SkincareService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRoutine', () => {
    it('throws SKINCARE_ROUTINE_NOT_FOUND when missing', async () => {
      vi.mocked(skincareRepository.findById).mockResolvedValueOnce(null);
      await expect(skincareService.getRoutine(mockUserId, mockRoutineId)).rejects.toThrow(
        'SKINCARE_ROUTINE_NOT_FOUND'
      );
    });

    it('throws SKINCARE_ROUTINE_NOT_FOUND when owned by a different user', async () => {
      vi.mocked(skincareRepository.findById).mockResolvedValueOnce(makeRoutine({ userId: 'someone-else' }));
      await expect(skincareService.getRoutine(mockUserId, mockRoutineId)).rejects.toThrow(
        'SKINCARE_ROUTINE_NOT_FOUND'
      );
    });
  });

  describe('createRoutine', () => {
    it('assigns sequential order to steps based on input array position', async () => {
      vi.mocked(skincareRepository.create).mockResolvedValueOnce(makeRoutine());

      await skincareService.createRoutine(mockUserId, {
        name: 'Morning Routine',
        steps: [{ name: 'Cleanser' }, { name: 'Moisturizer' }, { name: 'SPF' }],
      } as any);

      expect(skincareRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          steps: [
            { order: 1, name: 'Cleanser', product: null },
            { order: 2, name: 'Moisturizer', product: null },
            { order: 3, name: 'SPF', product: null },
          ],
        })
      );
    });
  });

  describe('logRoutine', () => {
    it('marks isComplete=false and does not emit when only some steps are done', async () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');
      vi.mocked(skincareRepository.findById).mockResolvedValueOnce(makeRoutine());
      vi.mocked(skincareRepository.findLog).mockResolvedValueOnce(null);
      vi.mocked(skincareRepository.upsertLog).mockResolvedValueOnce({ isComplete: false } as any);

      const result = await skincareService.logRoutine(mockUserId, mockRoutineId, '2026-08-08', [1]);

      expect(skincareRepository.upsertLog).toHaveBeenCalledWith(
        mockRoutineId,
        '2026-08-08',
        expect.objectContaining({ completedSteps: [1], totalSteps: 3, isComplete: false })
      );
      expect(result.alreadyLogged).toBe(false);
      expect(emitSpy).not.toHaveBeenCalledWith(DomainEvents.SKINCARE_COMPLETED, expect.anything());
    });

    it('defaults to all steps and emits SKINCARE_COMPLETED when omitted', async () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');
      vi.mocked(skincareRepository.findById).mockResolvedValueOnce(makeRoutine());
      vi.mocked(skincareRepository.findLog).mockResolvedValueOnce(null);
      vi.mocked(skincareRepository.upsertLog).mockResolvedValueOnce({ isComplete: true } as any);

      await skincareService.logRoutine(mockUserId, mockRoutineId, '2026-08-08');

      expect(skincareRepository.upsertLog).toHaveBeenCalledWith(
        mockRoutineId,
        '2026-08-08',
        expect.objectContaining({ completedSteps: [1, 2, 3], totalSteps: 3, isComplete: true })
      );
      expect(emitSpy).toHaveBeenCalledWith(
        DomainEvents.SKINCARE_COMPLETED,
        expect.objectContaining({ userId: mockUserId, routineId: mockRoutineId, date: '2026-08-08' })
      );
    });

    it('does not re-emit when the routine was already complete for that date', async () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');
      vi.mocked(skincareRepository.findById).mockResolvedValueOnce(makeRoutine());
      vi.mocked(skincareRepository.findLog).mockResolvedValueOnce({ isComplete: true } as any);
      vi.mocked(skincareRepository.upsertLog).mockResolvedValueOnce({ isComplete: true } as any);

      const result = await skincareService.logRoutine(mockUserId, mockRoutineId, '2026-08-08');

      expect(emitSpy).not.toHaveBeenCalledWith(DomainEvents.SKINCARE_COMPLETED, expect.anything());
      expect(result.alreadyLogged).toBe(true);
    });

    it('filters out step numbers that do not belong to the routine', async () => {
      vi.mocked(skincareRepository.findById).mockResolvedValueOnce(makeRoutine());
      vi.mocked(skincareRepository.findLog).mockResolvedValueOnce(null);
      vi.mocked(skincareRepository.upsertLog).mockResolvedValueOnce({ isComplete: false } as any);

      await skincareService.logRoutine(mockUserId, mockRoutineId, '2026-08-08', [1, 99]);

      expect(skincareRepository.upsertLog).toHaveBeenCalledWith(
        mockRoutineId,
        '2026-08-08',
        expect.objectContaining({ completedSteps: [1] })
      );
    });
  });

  describe('undoLog', () => {
    it('deletes the log for the given date', async () => {
      vi.mocked(skincareRepository.findById).mockResolvedValueOnce(makeRoutine());

      await skincareService.undoLog(mockUserId, mockRoutineId, '2026-08-08');

      expect(skincareRepository.deleteLog).toHaveBeenCalledWith(mockRoutineId, '2026-08-08');
    });
  });
});
