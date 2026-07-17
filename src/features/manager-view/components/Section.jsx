// Spreadsheet-style section: navy header bar (via --mv-head tokens) + white card body.
export function SectionHeader({ title, icon: Icon, right }) {
  return (
    <div className="mv-head-bar flex items-center justify-between gap-2 px-3.5 py-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 opacity-90" />}
        <h3 className="text-xs font-semibold uppercase tracking-wider">{title}</h3>
      </div>
      {right}
    </div>
  );
}

export function SectionCard({ title, icon, right, children, bodyClass = 'p-3.5', className = '' }) {
  return (
    <div className={`rounded-xl border border-border bg-card/60 overflow-hidden transition-smooth ${className}`}>
      <SectionHeader title={title} icon={icon} right={right} />
      <div className={bodyClass}>{children}</div>
    </div>
  );
}
