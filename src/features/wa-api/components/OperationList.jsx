import { useMemo } from 'react';
import { Search } from 'lucide-react';
import { WA_CATALOG } from '../catalog';

const METHOD_TONE = {
  GET: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  POST: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  PUT: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  PATCH: 'text-violet-400 border-violet-500/30 bg-violet-500/10',
  DELETE: 'text-red-400 border-red-500/30 bg-red-500/10',
};

function MethodBadge({ m }) {
  return (
    <span className={`shrink-0 rounded border px-1.5 py-px text-[9px] font-bold ${METHOD_TONE[m] || ''}`}>
      {m}
    </span>
  );
}

// Left rail: searchable, grouped list of every open-wa operation.
export default function OperationList({ query, onQuery, onPick, activeKey }) {
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return WA_CATALOG;
    return WA_CATALOG.map((g) => ({
      ...g,
      ops: g.ops.filter(
        (o) =>
          o.p.toLowerCase().includes(q) ||
          o.s.toLowerCase().includes(q) ||
          o.m.toLowerCase() === q,
      ),
    })).filter((g) => g.ops.length);
  }, [query]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search endpoints…"
            className="w-full rounded-md border border-input bg-input/40 py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none transition-smooth"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        {groups.length === 0 ? (
          <p className="p-4 text-center text-xs text-muted-foreground">No matching endpoints.</p>
        ) : (
          groups.map((g) => (
            <div key={g.group} className="border-b border-border/50">
              <div className="sticky top-0 z-10 bg-card/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
                {g.group}
              </div>
              {g.ops.map((o) => {
                const key = `${o.m} ${o.p}`;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onPick(o)}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left transition-smooth ${
                      activeKey === key ? 'bg-primary/10' : 'hover:bg-secondary/40'
                    }`}
                    title={o.s}
                  >
                    <MethodBadge m={o.m} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-[11px] text-foreground">{o.p}</span>
                      <span className="block truncate text-[10px] text-muted-foreground">{o.s}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
