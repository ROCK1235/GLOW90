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

/** daysOfWeek is a list of 0 (Sun) - 6 (Sat); empty/undefined means "every day". */
export function isDueOnDate(daysOfWeek: number[] | undefined, dateStr: string): boolean {
  if (!daysOfWeek || daysOfWeek.length === 0) return true;
  return daysOfWeek.includes(parseDateStr(dateStr).getUTCDay());
}
