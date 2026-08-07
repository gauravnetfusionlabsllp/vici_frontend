/**
 * Headline number + a plain-English line explaining what it means.
 *
 * Values use proportional figures (never `tabular-nums`) — equal-width digits make a
 * large standalone number look loose.
 */
export default function StatTile({ icon: Icon, label, value, hint, accent, loading, badge }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="w-3.5 h-3.5 shrink-0" style={accent ? { color: accent } : undefined} />}
        <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
        {/* Marks a value the date range can't scope — a point-in-time fact. */}
        {badge && (
          <span
            title="Current value — not affected by the selected dates"
            className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wide"
          >
            {badge}
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-8 w-20 rounded bg-muted animate-pulse" />
      ) : (
        <div className="text-3xl font-semibold leading-none text-foreground">{value}</div>
      )}

      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}
