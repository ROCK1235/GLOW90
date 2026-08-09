// Matches the backend's date convention (habits/service/streak.ts): calendar
// dates are UTC "YYYY-MM-DD" strings, not device-local calendar days.
export function todayUTCStr(): string {
  return new Date().toISOString().slice(0, 10);
}
