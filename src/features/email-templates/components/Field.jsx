export default function Field({ label, children, required }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
