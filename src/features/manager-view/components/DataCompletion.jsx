import { useMemo } from 'react';
import { computeDataCompletion, fmtPct } from '../utils';

// Green / amber / red by completeness.
function tone(pct) {
  if (pct >= 80) return { bar: 'bg-[hsl(var(--status-active))]', text: 'text-[hsl(var(--status-active))]' };
  if (pct >= 50) return { bar: 'bg-[hsl(var(--status-waiting))]', text: 'text-[hsl(var(--status-waiting))]' };
  return { bar: 'bg-destructive', text: 'text-destructive' };
}

export default function DataCompletion({ data }) {
  const rows = useMemo(() => computeDataCompletion(data), [data]);

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
          <th className="text-left font-medium py-1.5 px-1">Field</th>
          <th className="text-right font-medium py-1.5 px-1 w-16">Done</th>
          <th className="text-right font-medium py-1.5 px-1 w-16">Total</th>
          <th className="text-left font-medium py-1.5 px-1 w-40">Completion</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const t = tone(r.pct);
          return (
            <tr key={r.field} className="border-t border-border/40">
              <td className="py-1.5 px-1 text-foreground/85">{r.field}</td>
              <td className="py-1.5 px-1 text-right font-mono-nums text-foreground/80">{r.completed}</td>
              <td className="py-1.5 px-1 text-right font-mono-nums text-muted-foreground">{r.total}</td>
              <td className="py-1.5 px-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-secondary/50 overflow-hidden">
                    <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${Math.max(r.pct, 2)}%` }} />
                  </div>
                  <span className={`w-12 text-right font-mono-nums font-semibold ${t.text}`}>{fmtPct(r.pct)}</span>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
