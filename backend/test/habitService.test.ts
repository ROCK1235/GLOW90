import { describe, it, expect, beforeEach, vi } from 'vitest';
import { habitService } from '../src/modules/habits/service/habitService.js';
import { habitRepository } from '../src/modules/habits/repository/habitRepository.js';
import { eventBus, DomainEvents } from '../src/events/bus.js';

vi.mock('../src/modules/habits/repository/habitRepository.js');

const mockUserId = '507f1f77bcf86cd799439011';
const mockHabitId = '507f1f77bcf86cd799439099';

function makeHabit(overrides: Record<string, unknown> = {}) {
  return {
    _id: mockHabitId,
    userId: mockUserId,
    name: 'Drink Water',
    cadence: { daysOfWeek: [] },
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    isActive: true,
    ...overrides,
  } as any;
}

describe('HabitService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHabit', () => {
    it('throws HABIT_NOT_FOUND when the habit does not exist', async () => {
      vi.mocked(habitRepository.findById).mockResolvedValueOnce(null);
      await expect(habitService.getHabit(mockUserId, mockHabitId)).rejects.toThrow('HABIT_NOT_FOUND');
    });

    it("throws HABIT_NOT_FOUND when the habit belongs to a different user", async () => {
      vi.mocked(habitRepository.findById).mockResolvedValueOnce(makeHabit({ userId: 'someone-else' }));
      await expect(habitService.getHabit(mockUserId, mockHabitId)).rejects.toThrow('HABIT_NOT_FOUND');
    });
  });

  describe('logCompletion', () => {
    it('returns alreadyLogged=true without creating a duplicate log', async () => {
      vi.mocked(habitRepository.findById).mockResolvedValueOnce(makeHabit());
      vi.mocked(habitRepository.findLog).mockResolvedValueOnce({ date: '2026-08-08' } as any);

      const result = await habitService.logCompletion(mockUserId, mockHabitId, '2026-08-08');

      expect(result.alreadyLogged).toBe(true);
      expect(habitRepository.createLog).not.toHaveBeenCalled();
    });

    it('starts a streak of 1 on the very first completion and emits HABIT_LOGGED', async () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');
      vi.mocked(habitRepository.findById).mockResolvedValueOnce(makeHabit());
      vi.mocked(habitRepository.findLog).mockResolvedValueOnce(null);
      vi.mocked(habitRepository.update).mockResolvedValueOnce(
        makeHabit({ currentStreak: 1, longestStreak: 1, lastCompletedDate: '2026-08-08' })
      );

      const result = await habitService.logCompletion(mockUserId, mockHabitId, '2026-08-08');

      expect(habitRepository.update).toHaveBeenCalledWith(mockHabitId, {
        currentStreak: 1,
        longestStreak: 1,
        lastCompletedDate: '2026-08-08',
      });
      expect(result.habit.currentStreak).toBe(1);
      expect(emitSpy).toHaveBeenCalledWith(DomainEvents.HABIT_LOGGED, expect.objectContaining({ streak: 1 }));
      expect(emitSpy).toHaveBeenCalledWith(DomainEvents.HABIT_STREAK_ADVANCED, expect.objectContaining({ streak: 1 }));
    });

    it('increments the streak for a consecutive daily completion', async () => {
      vi.mocked(habitRepository.findById).mockResolvedValueOnce(
        makeHabit({ currentStreak: 3, longestStreak: 3, lastCompletedDate: '2026-08-07' })
      );
      vi.mocked(habitRepository.findLog).mockResolvedValueOnce(null);
      vi.mocked(habitRepository.update).mockResolvedValueOnce(
        makeHabit({ currentStreak: 4, longestStreak: 4, lastCompletedDate: '2026-08-08' })
      );

      await habitService.logCompletion(mockUserId, mockHabitId, '2026-08-08');

      expect(habitRepository.update).toHaveBeenCalledWith(mockHabitId, {
        currentStreak: 4,
        longestStreak: 4,
        lastCompletedDate: '2026-08-08',
      });
    });

    it('resets the streak to 1 after a gap, and updates lastCompletedDate', async () => {
      vi.mocked(habitRepository.findById).mockResolvedValueOnce(
        makeHabit({ currentStreak: 5, longestStreak: 5, lastCompletedDate: '2026-08-01' })
      );
      vi.mocked(habitRepository.findLog).mockResolvedValueOnce(null);
      vi.mocked(habitRepository.update).mockResolvedValueOnce(makeHabit());

      await habitService.logCompletion(mockUserId, mockHabitId, '2026-08-08');

      expect(habitRepository.update).toHaveBeenCalledWith(mockHabitId, {
        currentStreak: 1,
        longestStreak: 5,
        lastCompletedDate: '2026-08-08',
      });
    });

    it('does not disturb the live streak when backfilling an older date', async () => {
      vi.mocked(habitRepository.findById).mockResolvedValueOnce(
        makeHabit({ currentStreak: 3, longestStreak: 3, lastCompletedDate: '2026-08-08' })
      );
      vi.mocked(habitRepository.findLog).mockResolvedValueOnce(null);
      vi.mocked(habitRepository.update).mockResolvedValueOnce(makeHabit());

      await habitService.logCompletion(mockUserId, mockHabitId, '2026-08-01');

      expect(habitRepository.update).toHaveBeenCalledWith(mockHabitId, {
        currentStreak: 3,
        longestStreak: 3,
        lastCompletedDate: '2026-08-08',
      });
    });
  });

  describe('undoCompletion', () => {
    it('does nothing to streak fields when undoing a non-latest date', async () => {
      vi.mocked(habitRepository.findById).mockResolvedValueOnce(
        makeHabit({ currentStreak: 3, lastCompletedDate: '2026-08-08' })
      );

      await habitService.undoCompletion(mockUserId, mockHabitId, '2026-08-01');

      expect(habitRepository.deleteLog).toHaveBeenCalledWith(mockHabitId, '2026-08-01');
      expect(habitRepository.update).not.toHaveBeenCalled();
    });

    it('recomputes streak from remaining logs when undoing the latest date', async () => {
      vi.mocked(habitRepository.findById).mockResolvedValueOnce(
        makeHabit({ currentStreak: 3, lastCompletedDate: '2026-08-08' })
      );
      vi.mocked(habitRepository.findRecentLogDates).mockResolvedValueOnce(['2026-08-07', '2026-08-06']);
      vi.mocked(habitRepository.update).mockResolvedValueOnce(makeHabit({ currentStreak: 2 }));

      await habitService.undoCompletion(mockUserId, mockHabitId, '2026-08-08');

      expect(habitRepository.update).toHaveBeenCalledWith(mockHabitId, {
        currentStreak: 2,
        lastCompletedDate: '2026-08-07',
      });
    });

    it('resets to 0/null when undoing the only completion', async () => {
      vi.mocked(habitRepository.findById).mockResolvedValueOnce(
        makeHabit({ currentStreak: 1, lastCompletedDate: '2026-08-08' })
      );
      vi.mocked(habitRepository.findRecentLogDates).mockResolvedValueOnce([]);
      vi.mocked(habitRepository.update).mockResolvedValueOnce(makeHabit());

      await habitService.undoCompletion(mockUserId, mockHabitId, '2026-08-08');

      expect(habitRepository.update).toHaveBeenCalledWith(mockHabitId, {
        currentStreak: 0,
        lastCompletedDate: null,
      });
    });
  });

  describe('repairStreaks', () => {
    it('resets currentStreak to 0 for habits with a broken streak', async () => {
      vi.mocked(habitRepository.findActiveHabits).mockResolvedValueOnce([
        makeHabit({ currentStreak: 5, lastCompletedDate: '2026-08-01' }), // gap -> broken
        makeHabit({ _id: 'h2', currentStreak: 0, lastCompletedDate: null }), // untouched
      ]);

      const repaired = await habitService.repairStreaks();

      expect(repaired).toBe(1);
      expect(habitRepository.update).toHaveBeenCalledTimes(1);
      expect(habitRepository.update).toHaveBeenCalledWith(mockHabitId, { currentStreak: 0 });
    });
  });
});
