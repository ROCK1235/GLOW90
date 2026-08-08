import { addDaysStr, isDueOnDate, toDateStr, todayStr } from '../../../common/utils/dateCadence.js';

export { addDaysStr, isDueOnDate, toDateStr, todayStr };

export function previousDueDateStr(daysOfWeek: number[], fromDateStr: string): string {
  let cursor = fromDateStr;
  for (let i = 0; i < 7; i++) {
    cursor = addDaysStr(cursor, -1);
    if (isDueOnDate(daysOfWeek, cursor)) return cursor;
  }
  return addDaysStr(fromDateStr, -1);
}

export function computeCurrentStreak(
  daysOfWeek: number[],
  completedDates: Set<string>,
  asOfDateStr: string
): number {
  if (!completedDates.has(asOfDateStr)) return 0;

  let streak = 1;
  let cursor = asOfDateStr;
  for (let i = 0; i < 3660; i++) {
    const prevDue = previousDueDateStr(daysOfWeek, cursor);
    if (!completedDates.has(prevDue)) break;
    streak += 1;
    cursor = prevDue;
  }
  return streak;
}

/**
 * True if a due day was missed strictly between lastCompletedDate and todayDateStr
 * (today itself is never "missed" until the repair job runs on a later day).
 */
export function isStreakBroken(daysOfWeek: number[], lastCompletedDate: string, todayDateStr: string): boolean {
  let cursor = lastCompletedDate;
  for (let i = 0; i < 3660; i++) {
    cursor = addDaysStr(cursor, 1);
    if (cursor >= todayDateStr) return false;
    if (isDueOnDate(daysOfWeek, cursor)) return true;
  }
  return false;
}
