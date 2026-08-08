function parseDateStr(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function addDaysStr(dateStr: string, delta: number): string {
  const d = parseDateStr(dateStr);
  d.setUTCDate(d.getUTCDate() + delta);
  return toDateStr(d);
}

export function isDueOnDate(daysOfWeek: number[], dateStr: string): boolean {
  if (!daysOfWeek || daysOfWeek.length === 0) return true;
  return daysOfWeek.includes(parseDateStr(dateStr).getUTCDay());
}

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
