export function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function routeStatus(lead) {
  const now   = new Date();
  const start = new Date(lead.startdate);
  const end   = lead.enddate ? new Date(lead.enddate) : null;
  if (!lead.isactive) return 'paused';
  if (now < start)    return 'scheduled';
  if (end && now > end) return 'expired';
  if (!end)           return 'live';
  return 'bounded';
}

export const STATUS_CFG = {
  live:      { label: 'LIVE',      cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400', pulse: true  },
  bounded:   { label: 'BOUNDED',   cls: 'bg-amber-500/15  text-amber-300  border-amber-500/30',    dot: 'bg-amber-400',   pulse: false },
  scheduled: { label: 'SCHEDULED', cls: 'bg-sky-500/15    text-sky-300    border-sky-500/30',      dot: 'bg-sky-400',     pulse: false },
  expired:   { label: 'EXPIRED',   cls: 'bg-rose-500/15   text-rose-300   border-rose-500/30',     dot: 'bg-rose-400',    pulse: false },
  paused:    { label: 'PAUSED',    cls: 'bg-slate-700/40  text-slate-400  border-slate-600/40',    dot: 'bg-slate-500',   pulse: false },
};

export const FILTERS = [
  { key: 'all',       label: 'All'       },
  { key: 'live',      label: 'Live'      },
  { key: 'bounded',   label: 'Bounded'   },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'paused',    label: 'Paused'    },
  { key: 'expired',   label: 'Expired'   },
];
