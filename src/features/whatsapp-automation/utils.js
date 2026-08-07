// 0 = Sunday … 6 = Saturday — matches Date.getDay() and the INT[] stored in
// whatsapp_templates.days_of_week, so no translation is needed anywhere.
export const DAYS = [
  { value: 1, short: 'Mon', label: 'Monday' },
  { value: 2, short: 'Tue', label: 'Tuesday' },
  { value: 3, short: 'Wed', label: 'Wednesday' },
  { value: 4, short: 'Thu', label: 'Thursday' },
  { value: 5, short: 'Fri', label: 'Friday' },
  { value: 6, short: 'Sat', label: 'Saturday' },
  { value: 0, short: 'Sun', label: 'Sunday' },
];

export const WEEKDAYS = [1, 2, 3, 4, 5];
export const WEEKEND = [0, 6];

export const HOLIDAY_MODES = [
  { value: 'ignore',  label: "Doesn't matter", hint: 'Holidays are treated like any other day.' },
  { value: 'only',    label: 'Holidays only',  hint: 'Fires only on dates in the holiday calendar.' },
  { value: 'exclude', label: 'Skip holidays',  hint: 'Never fires on a holiday date.' },
];

const sameSet = (a, b) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

/** "Mon–Fri" / "Sat, Sun" / "Every day" */
export function describeDays(days = []) {
  if (!days.length) return 'Every day';
  if (sameSet(days, WEEKDAYS)) return 'Mon–Fri';
  if (sameSet(days, WEEKEND)) return 'Sat & Sun';
  return DAYS.filter((d) => days.includes(d.value)).map((d) => d.short).join(', ');
}

/** "09:00 – 18:00" / "All day" / "from 21:00" — mirrors the server's [start, end) window. */
export function describeWindow(start, end) {
  if (!start && !end) return 'All day';
  if (start && !end) return `from ${start}`;
  if (!start && end) return `until ${end}`;
  const wraps = start > end;
  return `${start} – ${end}${wraps ? ' (overnight)' : ''}`;
}

export function describeHoliday(mode) {
  if (mode === 'only') return 'Holidays only';
  if (mode === 'exclude') return 'Skips holidays';
  return null;
}

/** Empty filter list means "any", which is what the backend does too. */
export function describeFilter(list = [], label) {
  if (!list.length) return `Any ${label}`;
  if (list.length <= 2) return list.join(', ');
  return `${list.slice(0, 2).join(', ')} +${list.length - 2}`;
}

export function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });
}

/** Normalize an RTK Query error into a readable message. */
export function apiError(e, fallback = 'Something went wrong') {
  const d = e?.data?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg).filter(Boolean).join(' ') || fallback;
  return e?.error || e?.message || fallback;
}
