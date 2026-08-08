import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supplementService } from '../src/modules/supplements/service/supplementService.js';
import { supplementRepository } from '../src/modules/supplements/repository/supplementRepository.js';
import { eventBus, DomainEvents } from '../src/events/bus.js';

vi.mock('../src/modules/supplements/repository/supplementRepository.js');

const mockUserId = '507f1f77bcf86cd799439011';
const mockSupplementId = '507f1f77bcf86cd799439099';

function makeSupplement(overrides: Record<string, unknown> = {}) {
  return {
    _id: mockSupplementId,
    userId: mockUserId,
    name: 'Vitamin D',
    dosageAmount: 1000,
    dosageUnit: 'iu',
    notes: null,
    schedule: { daysOfWeek: [], times: ['09:00'] },
    isActive: true,
    ...overrides,
  } as any;
}

describe('SupplementService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSupplement', () => {
    it('throws SUPPLEMENT_NOT_FOUND when missing', async () => {
      vi.mocked(supplementRepository.findById).mockResolvedValueOnce(null);
      await expect(supplementService.getSupplement(mockUserId, mockSupplementId)).rejects.toThrow(
        'SUPPLEMENT_NOT_FOUND'
      );
    });

    it('throws SUPPLEMENT_NOT_FOUND when owned by a different user', async () => {
      vi.mocked(supplementRepository.findById).mockResolvedValueOnce(makeSupplement({ userId: 'someone-else' }));
      await expect(supplementService.getSupplement(mockUserId, mockSupplementId)).rejects.toThrow(
        'SUPPLEMENT_NOT_FOUND'
      );
    });
  });

  describe('createSupplement', () => {
    it('defaults schedule to every day at 09:00 when omitted', async () => {
      vi.mocked(supplementRepository.create).mockResolvedValueOnce(makeSupplement());

      await supplementService.createSupplement(mockUserId, {
        name: 'Vitamin D',
        dosageAmount: 1000,
        dosageUnit: 'iu',
      } as any);

      expect(supplementRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ schedule: { daysOfWeek: [], times: ['09:00'] } })
      );
    });
  });

  describe('logDose', () => {
    it('returns alreadyLogged=true without creating a duplicate', async () => {
      vi.mocked(supplementRepository.findById).mockResolvedValueOnce(makeSupplement());
      vi.mocked(supplementRepository.findLog).mockResolvedValueOnce({ date: '2026-08-08', time: '09:00' } as any);

      const result = await supplementService.logDose(mockUserId, mockSupplementId, '2026-08-08', '09:00');

      expect(result.alreadyLogged).toBe(true);
      expect(supplementRepository.createLog).not.toHaveBeenCalled();
    });

    it('defaults time to the first scheduled slot when omitted', async () => {
      vi.mocked(supplementRepository.findById).mockResolvedValueOnce(
        makeSupplement({ schedule: { daysOfWeek: [], times: ['08:00', '20:00'] } })
      );
      vi.mocked(supplementRepository.findLog).mockResolvedValueOnce(null);

      await supplementService.logDose(mockUserId, mockSupplementId, '2026-08-08');

      expect(supplementRepository.findLog).toHaveBeenCalledWith(mockSupplementId, '2026-08-08', '08:00');
      expect(supplementRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({ date: '2026-08-08', time: '08:00' })
      );
    });

    it('creates a log and emits SUPPLEMENT_TAKEN', async () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');
      vi.mocked(supplementRepository.findById).mockResolvedValueOnce(makeSupplement());
      vi.mocked(supplementRepository.findLog).mockResolvedValueOnce(null);

      const result = await supplementService.logDose(mockUserId, mockSupplementId, '2026-08-08', '09:00');

      expect(result.alreadyLogged).toBe(false);
      expect(emitSpy).toHaveBeenCalledWith(
        DomainEvents.SUPPLEMENT_TAKEN,
        expect.objectContaining({ userId: mockUserId, supplementId: mockSupplementId, date: '2026-08-08', time: '09:00' })
      );
    });
  });

  describe('undoDose', () => {
    it('deletes the matching log', async () => {
      vi.mocked(supplementRepository.findById).mockResolvedValueOnce(makeSupplement());

      await supplementService.undoDose(mockUserId, mockSupplementId, '2026-08-08', '09:00');

      expect(supplementRepository.deleteLog).toHaveBeenCalledWith(mockSupplementId, '2026-08-08', '09:00');
    });
  });

  describe('getAdherence', () => {
    it('computes expected doses for a daily single-time schedule over an inclusive range', async () => {
      vi.mocked(supplementRepository.findById).mockResolvedValueOnce(
        makeSupplement({ schedule: { daysOfWeek: [], times: ['09:00'] } })
      );
      vi.mocked(supplementRepository.countLogsInRange).mockResolvedValueOnce(5);

      // 2026-08-01 .. 2026-08-08 inclusive = 8 days, 1 dose/day = 8 expected
      const result = await supplementService.getAdherence(mockUserId, mockSupplementId, '2026-08-01', '2026-08-08');

      expect(result.expectedDoses).toBe(8);
      expect(result.takenDoses).toBe(5);
      expect(result.adherenceRate).toBeCloseTo(5 / 8);
    });

    it('accounts for multiple times per day and specific weekdays', async () => {
      // Mon/Wed/Fri only, 2 doses per due day
      vi.mocked(supplementRepository.findById).mockResolvedValueOnce(
        makeSupplement({ schedule: { daysOfWeek: [1, 3, 5], times: ['08:00', '20:00'] } })
      );
      vi.mocked(supplementRepository.countLogsInRange).mockResolvedValueOnce(0);

      // 2026-08-03 (Mon) .. 2026-08-09 (Sun): due days are 08-03 (Mon), 08-05 (Wed), 08-07 (Fri) = 3 due days * 2 = 6
      const result = await supplementService.getAdherence(mockUserId, mockSupplementId, '2026-08-03', '2026-08-09');

      expect(result.expectedDoses).toBe(6);
    });

    it('caps adherenceRate at 1 even if more doses were logged than expected', async () => {
      vi.mocked(supplementRepository.findById).mockResolvedValueOnce(
        makeSupplement({ schedule: { daysOfWeek: [], times: ['09:00'] } })
      );
      vi.mocked(supplementRepository.countLogsInRange).mockResolvedValueOnce(20);

      const result = await supplementService.getAdherence(mockUserId, mockSupplementId, '2026-08-01', '2026-08-02');

      expect(result.adherenceRate).toBe(1);
    });
  });
});
