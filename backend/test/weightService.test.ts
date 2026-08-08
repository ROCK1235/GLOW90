import { describe, it, expect, beforeEach, vi } from 'vitest';
import { weightService } from '../src/modules/weight/service/weightService.js';
import { weightRepository } from '../src/modules/weight/repository/weightRepository.js';
import { eventBus, DomainEvents } from '../src/events/bus.js';

vi.mock('../src/modules/weight/repository/weightRepository.js');

const mockUserId = '507f1f77bcf86cd799439011';

describe('WeightService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logWeight', () => {
    it('upserts using today when no date is given, and emits WEIGHT_LOGGED', async () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');
      vi.mocked(weightRepository.upsertLog).mockResolvedValueOnce({ weightKg: 70 } as any);

      await weightService.logWeight(mockUserId, { weightKg: 70 } as any);

      expect(weightRepository.upsertLog).toHaveBeenCalledWith(
        mockUserId,
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        expect.objectContaining({ weightKg: 70, bodyFatPercent: null, measurements: null, note: null })
      );
      expect(emitSpy).toHaveBeenCalledWith(
        DomainEvents.WEIGHT_LOGGED,
        expect.objectContaining({ userId: mockUserId, weightKg: 70 })
      );
    });

    it('normalizes partial measurements, filling omitted fields with null', async () => {
      vi.mocked(weightRepository.upsertLog).mockResolvedValueOnce({} as any);

      await weightService.logWeight(mockUserId, {
        weightKg: 70,
        date: '2026-08-08',
        measurements: { waistCm: 80 },
      } as any);

      expect(weightRepository.upsertLog).toHaveBeenCalledWith(
        mockUserId,
        '2026-08-08',
        expect.objectContaining({
          measurements: { waistCm: 80, chestCm: null, hipsCm: null, armsCm: null, thighsCm: null },
        })
      );
    });

    it('overwrites an existing entry for the same date (upsert, not accumulate)', async () => {
      vi.mocked(weightRepository.upsertLog).mockResolvedValueOnce({ weightKg: 69.5 } as any);

      await weightService.logWeight(mockUserId, { weightKg: 69.5, date: '2026-08-08' } as any);

      expect(weightRepository.upsertLog).toHaveBeenCalledWith(
        mockUserId,
        '2026-08-08',
        expect.objectContaining({ weightKg: 69.5 })
      );
    });
  });

  describe('getLatest', () => {
    it('returns null when no logs exist', async () => {
      vi.mocked(weightRepository.findLatest).mockResolvedValueOnce(null);
      const result = await weightService.getLatest(mockUserId);
      expect(result).toBeNull();
    });

    it('returns the most recent log', async () => {
      vi.mocked(weightRepository.findLatest).mockResolvedValueOnce({ weightKg: 70, date: '2026-08-08' } as any);
      const result = await weightService.getLatest(mockUserId);
      expect(result?.weightKg).toBe(70);
    });
  });

  describe('listLogs', () => {
    it('defaults to a 90-day lookback window when no range is given', async () => {
      vi.mocked(weightRepository.findInRange).mockResolvedValueOnce([]);

      await weightService.listLogs(mockUserId);

      const [, fromArg, toArg] = vi.mocked(weightRepository.findInRange).mock.calls[0];
      const days = (Date.parse(toArg) - Date.parse(fromArg)) / (24 * 60 * 60 * 1000);
      expect(days).toBe(90);
    });
  });

  describe('deleteLog', () => {
    it('deletes by userId and date', async () => {
      await weightService.deleteLog(mockUserId, '2026-08-08');
      expect(weightRepository.deleteByDate).toHaveBeenCalledWith(mockUserId, '2026-08-08');
    });
  });
});
