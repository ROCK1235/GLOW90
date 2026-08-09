// The backend stores/expects 24-hour "HH:mm" strings; the UI shows 12-hour
// AM/PM to avoid the ambiguity of typing/reading 24-hour time on a phone.

export function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  const hour24 = Number(hStr);
  const minute = Number(mStr);
  const meridiem = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${meridiem}`;
}

export function to24HourTime(hour12: number, minute: number, meridiem: 'AM' | 'PM'): string {
  const hour24 = meridiem === 'PM' ? (hour12 % 12) + 12 : hour12 % 12;
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
