// Date helpers for the DoubleTick page filter. Kept out of the component file so
// fast-refresh still works there.

export const toYMD = (d) => {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const fromYMD = (s) => {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const shift = (d, n) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };

/** Quick jumps, computed on call so they stay correct across midnight. */
export function presetRanges() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1);

  return [
    { label: 'Today',        sd: toYMD(today),             ed: toYMD(today) },
    { label: 'Yesterday',    sd: toYMD(shift(today, -1)),  ed: toYMD(shift(today, -1)) },
    { label: 'Last 7 days',  sd: toYMD(shift(today, -6)),  ed: toYMD(today) },
    { label: 'Last 30 days', sd: toYMD(shift(today, -29)), ed: toYMD(today) },
    { label: 'This month',   sd: toYMD(monthStart),        ed: toYMD(today) },
    { label: 'Last month',   sd: toYMD(lastMonthStart),    ed: toYMD(lastMonthEnd) },
  ];
}

/** "05 Jul 2026" */
export const fmtDate = (s) =>
  fromYMD(s)?.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) ?? '';
