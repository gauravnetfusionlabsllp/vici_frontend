export default function ConditionChip({ label, value, accent }) {
  if (!value) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] border
      ${accent
        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
        : 'bg-slate-800/60 border-slate-700/50 text-slate-400'
      }`}
    >
      <span className="text-slate-600">{label}</span>
      <span>{value}</span>
    </span>
  );
}
