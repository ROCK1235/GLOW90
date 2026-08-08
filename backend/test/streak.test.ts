import { describe, it, expect } from 'vitest';
import {
  addDaysStr,
  computeCurrentStreak,
  isDueOnDate,
  isStreakBroken,
  previousDueDateStr,
} from '../src/modules/habits/service/streak.js';

describe('streak utilities', () => {
  describe('addDaysStr', () => {
    it('adds and subtracts days, crossing month/year boundaries', () => {
      expect(addDaysStr('2026-01-05', 1)).toBe('2026-01-06');
      expect(addDaysStr('2026-01-01', -1)).toBe('2025-12-31');
      expect(addDaysStr('2026-02-28', 1)).toBe('2026-03-01');
    });
  });

  describe('isDueOnDate', () => {
    it('is always due when daysOfWeek is empty (daily habit)', () => {
      expect(isDueOnDate([], '2026-08-08')).toBe(true);
    });

    it('respects specific days of week', () => {
      // 2026-08-08 is a Saturday (day 6)
      expect(isDueOnDate([6], '2026-08-08')).toBe(true);
      expect(isDueOnDate([1, 3, 5], '2026-08-08')).toBe(false);
    });
  });

  describe('previousDueDateStr', () => {
    it('returns the previous day for a daily habit', () => {
      expect(previousDueDateStr([], '2026-08-08')).toBe('2026-08-07');
    });

    it('skips back to the previous matching weekday', () => {
      // 2026-08-08 is Saturday; previous Saturday is 2026-08-01
      expect(previousDueDateStr([6], '2026-08-08')).toBe('2026-08-01');
    });
  });

  describe('computeCurrentStreak', () => {
    it('returns 0 when asOfDate itself is not completed', () => {
      const streak = computeCurrentStreak([], new Set(['2026-08-06']), '2026-08-08');
      expect(streak).toBe(0);
    });

    it('counts consecutive daily completions', () => {
      const dates = new Set(['2026-08-06', '2026-08-07', '2026-08-08']);
      expect(computeCurrentStreak([], dates, '2026-08-08')).toBe(3);
    });

    it('stops counting at the first gap', () => {
      const dates = new Set(['2026-08-08', '2026-08-07', '2026-08-04']);
      expect(computeCurrentStreak([], dates, '2026-08-08')).toBe(2);
    });

    it('counts consecutive completions for a specific-weekday habit', () => {
      // Every Saturday for 3 weeks: 07-25, 08-01, 08-08
      const dates = new Set(['2026-07-25', '2026-08-01', '2026-08-08']);
      expect(computeCurrentStreak([6], dates, '2026-08-08')).toBe(3);
    });
  });

  describe('isStreakBroken', () => {
    it('is not broken if last completion was yesterday (daily habit)', () => {
      expect(isStreakBroken([], '2026-08-07', '2026-08-08')).toBe(false);
    });

    it('is broken if a due day was missed in between', () => {
      expect(isStreakBroken([], '2026-08-05', '2026-08-08')).toBe(true);
    });

    it('is not broken for a weekly habit if the missed days were not due days', () => {
      // Last completed Saturday 08-01, today is Wed 08-05 — no due day (Saturday) has passed yet
      expect(isStreakBroken([6], '2026-08-01', '2026-08-05')).toBe(false);
    });

    it('is broken for a weekly habit once the next due day has passed', () => {
      // Last completed Saturday 08-01, today is 08-09 (the following Sunday) — Saturday 08-08 was missed
      expect(isStreakBroken([6], '2026-08-01', '2026-08-09')).toBe(true);
    });
  });
});
