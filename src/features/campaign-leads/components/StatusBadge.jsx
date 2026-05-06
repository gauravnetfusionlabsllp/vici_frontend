import { STATUS_CFG } from '../utils';

export default function StatusBadge({ status }) {
  const { label, cls, dot, pulse } = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-widest ${cls}`}>
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dot} opacity-60`} />}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dot}`} />
      </span>
      {label}
    </span>
  );
}
