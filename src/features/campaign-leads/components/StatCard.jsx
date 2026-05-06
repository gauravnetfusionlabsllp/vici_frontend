export default function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="flex-1 min-w-[130px] border border-border rounded-lg bg-card/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
        {Icon && <Icon className={`w-3.5 h-3.5 ${color ?? 'text-slate-500'}`} />}
      </div>
      <div className="text-2xl font-bold font-mono text-white">{value ?? '—'}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{sub}</div>}
    </div>
  );
}
