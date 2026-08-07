import { useState } from 'react';
import { BarChart3, Table2 } from 'lucide-react';

const VIEWS = [
  { id: 'chart', icon: BarChart3, label: 'Chart' },
  { id: 'table', icon: Table2, label: 'Table' },
];

/**
 * Card shell for every chart on the page.
 *
 * Each chart ships a **table-view twin**: the same numbers, readable without relying on
 * colour. That is what lets the charts use hues that sit below 3:1 against the light
 * surface, and it's what a screen-reader user or a colourblind reader falls back to.
 *
 * `explain` is the one-sentence, non-technical answer to "what am I looking at?".
 */
export default function ChartCard({
  title,
  explain,
  icon: Icon,
  columns,          // [{ key, label, align }] for the table twin
  rows = [],        // raw data rows backing the chart
  height = 260,
  children,
  empty = 'Nothing to show yet',
}) {
  const [view, setView] = useState('chart');
  const isEmpty = !rows.length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
      <div className="flex items-start justify-between gap-3 px-3.5 pt-3 pb-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
            <span className="truncate">{title}</span>
          </h3>
          {explain && <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{explain}</p>}
        </div>

        {/* Chart ⇄ table toggle */}
        <div className="flex shrink-0 rounded-md border border-border overflow-hidden" role="group" aria-label="View as">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              aria-pressed={view === v.id}
              title={`View as ${v.label.toLowerCase()}`}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] transition-colors ${
                view === v.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent text-muted-foreground hover:bg-muted'
              }`}
            >
              <v.icon className="w-3 h-3" />
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-3.5 pb-3.5 flex-1">
        {isEmpty ? (
          <div className="grid place-items-center text-xs italic text-muted-foreground" style={{ height }}>
            {empty}
          </div>
        ) : view === 'chart' ? (
          <div style={{ height }}>{children}</div>
        ) : (
          <div className="overflow-auto scrollbar-thin" style={{ maxHeight: height }}>
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-muted-foreground">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={`py-1.5 pr-3 font-medium ${c.align === 'right' ? 'text-right' : 'text-left'}`}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`py-1.5 pr-3 text-foreground ${
                          c.align === 'right' ? 'text-right tabular-nums' : 'text-left'
                        }`}
                      >
                        {c.render ? c.render(r) : r[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
