/**
 * Shared hover tooltip. Tooltips enhance but never gate — every value here is also
 * reachable through the card's table view.
 *
 * Text wears text tokens; the little swatch beside it carries the series identity.
 */
export default function ChartTooltip({ active, payload, label, ink: c, labelFormatter }) {
  if (!active || !payload?.length) return null;

  const heading = labelFormatter ? labelFormatter(label) : (payload[0]?.payload?.full ?? label);

  return (
    <div
      className="rounded-md border px-2.5 py-1.5 shadow-lg"
      style={{ background: c.surface, borderColor: c.grid }}
    >
      {heading != null && (
        <div className="text-[11px] mb-0.5" style={{ color: c.text }}>{heading}</div>
      )}
      {payload.map((p) => (
        <div
          key={p.name ?? p.dataKey}
          className="flex items-center gap-1.5 text-xs font-semibold tabular-nums"
          style={{ color: c.text }}
        >
          <span
            className="inline-block w-2 h-2 rounded-sm shrink-0"
            style={{ background: p.color || p.fill }}
          />
          {p.name ? `${p.name}: ` : ''}
          {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
}
