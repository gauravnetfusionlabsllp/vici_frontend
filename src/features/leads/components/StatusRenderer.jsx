import { DISPOSITIONS } from '../constants';

const STATUS_CLASSES = {
  READY:   'bg-emerald-500/25 text-emerald-300',
  INCALL:  'bg-blue-500/20 text-blue-400',
  PAUSED:  'bg-amber-500/20 text-amber-400',
  OFFLINE: 'bg-slate-500/20 text-slate-400',
};

export default function StatusRenderer(params) {
  const status = params.value;
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap
      ${STATUS_CLASSES[status] || 'bg-slate-600/20 text-slate-300'}`}>
      {status ? DISPOSITIONS.find((d) => d.value === status)?.label || status : '—'}
    </span>
  );
}
