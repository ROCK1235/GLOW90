import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waterService } from '../src/modules/water/service/waterService.js';
import { waterRepository } from '../src/modules/water/repository/waterRepository.js';
import { userRepository } from '../src/modules/users/repository/userRepository.js';
import { eventBus, DomainEvents } from '../src/events/bus.js';

vi.mock('../src/modules/water/repository/waterRepository.js');
vi.mock('../src/modules/users/repository/userRepository.js');

const mockUserId = '507f1f77bcf86cd799439011';

describe('WaterService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logWater', () => {
    it('falls back to the default 2500ml goal when settings are missing', async () => {
      vi.mocked(waterRepository.findByDate).mockResolvedValueOnce([]);
      vi.mocked(waterRepository.create).mockResolvedValueOnce({ amountMl: 500 } as any);
      vi.mocked(userRepository.findSettingsByUserId).mockResolvedValueOnce(null);

      const result = await waterService.logWater(mockUserId, 500, '2026-08-08');

      expect(result.goalMl).toBe(2500);
      expect(result.totalMl).toBe(500);
      expect(result.goalMet).toBe(false);
    });

    it('uses the user-configured hydration goal', async () => {
      vi.mocked(waterRepository.findByDate).mockResolvedValueOnce([]);
      vi.mocked(waterRepository.create).mockResolvedValueOnce({ amountMl: 1000 } as any);
      vi.mocked(userRepository.findSettingsByUserId).mockResolvedValueOnce({
        hydration: { dailyGoalMl: 1000 },
      } as any);

      const result = await waterService.logWater(mockUserId, 1000, '2026-08-08');

      expect(result.goalMl).toBe(1000);
      expect(result.goalMet).toBe(true);
    });

    it('sums against existing logs for the same date', async () => {
      vi.mocked(waterRepository.findByDate).mockResolvedValueOnce([{ amountMl: 500 }, { amountMl: 300 }] as any);
      vi.mocked(waterRepository.create).mockResolvedValueOnce({ amountMl: 250 } as any);
      vi.mocked(userRepository.findSettingsByUserId).mockResolvedValueOnce({
        hydration: { dailyGoalMl: 2500 },
      } as any);

      const result = await waterService.logWater(mockUserId, 250, '2026-08-08');

      expect(result.totalMl).toBe(1050);
    });

    it('emits WATER_GOAL_MET only on the transition to goal met', async () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');
      vi.mocked(waterRepository.findByDate).mockResolvedValueOnce([{ amountMl: 800 }] as any);
      vi.mocked(waterRepository.create).mockResolvedValueOnce({ amountMl: 300 } as any);
      vi.mocked(userRepository.findSettingsByUserId).mockResolvedValueOnce({
        hydration: { dailyGoalMl: 1000 },
      } as any);

      await waterService.logWater(mockUserId, 300, '2026-08-08');

      expect(emitSpy).toHaveBeenCalledWith(
        DomainEvents.WATER_GOAL_MET,
        expect.objectContaining({ userId: mockUserId, date: '2026-08-08', totalMl: 1100, goalMl: 1000 })
      );
    });

    it('does not re-emit WATER_GOAL_MET once the goal was already met', async () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');
      vi.mocked(waterRepository.findByDate).mockResolvedValueOnce([{ amountMl: 1200 }] as any);
      vi.mocked(waterRepository.create).mockResolvedValueOnce({ amountMl: 300 } as any);
      vi.mocked(userRepository.findSettingsByUserId).mockResolvedValueOnce({
        hydration: { dailyGoalMl: 1000 },
      } as any);

      await waterService.logWater(mockUserId, 300, '2026-08-08');

      expect(emitSpy).not.toHaveBeenCalledWith(DomainEvents.WATER_GOAL_MET, expect.anything());
    });
  });

  describe('undoLog', () => {
    it('throws WATER_LOG_NOT_FOUND when the log does not exist or is not owned', async () => {
      vi.mocked(waterRepository.findOwnedLog).mockResolvedValueOnce(null);
      await expect(waterService.undoLog(mockUserId, 'log1')).rejects.toThrow('WATER_LOG_NOT_FOUND');
      expect(waterRepository.deleteById).not.toHaveBeenCalled();
    });

    it('deletes an owned log', async () => {
      vi.mocked(waterRepository.findOwnedLog).mockResolvedValueOnce({ _id: 'log1' } as any);
      await waterService.undoLog(mockUserId, 'log1');
      expect(waterRepository.deleteById).toHaveBeenCalledWith('log1');
    });
  });

  describe('getDailySummary', () => {
    it('computes total and goalMet from the day\'s logs', async () => {
      vi.mocked(waterRepository.findByDate).mockResolvedValueOnce([{ amountMl: 1000 }, { amountMl: 800 }] as any);
      vi.mocked(userRepository.findSettingsByUserId).mockResolvedValueOnce({
        hydration: { dailyGoalMl: 1500 },
      } as any);

      const summary = await waterService.getDailySummary(mockUserId, '2026-08-08');

      expect(summary.totalMl).toBe(1800);
      expect(summary.goalMet).toBe(true);
      expect(summary.logs).toHaveLength(2);
    });
  });
});
