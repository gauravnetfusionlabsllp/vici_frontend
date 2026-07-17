import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Loader2 } from 'lucide-react';

/**
 * Searchable multi-select dropdown for the filter bar. Emits an array of selected string values.
 * Styled with theme tokens. Adapted from campaign-leads/CreateRuleModal's MultiSelectDropdown.
 */
export default function MultiSelectDropdown({
  label,
  icon: Icon,
  options = [],
  selected = [],
  onChange,
  loading = false,
  disabled = false,
  placeholder = 'All',
  emptyLabel = 'No options',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);

  const isInactive = loading || disabled;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => { if (!open) setQuery(''); }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;

  const toggle = (v) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  const selectAllFiltered = () =>
    onChange(Array.from(new Set([...selected, ...filtered])));
  const clearAll = () => onChange([]);

  return (
    <div className="flex flex-col gap-1" ref={wrapRef}>
      <label className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>

      <div className="relative">
        <button
          type="button"
          disabled={isInactive}
          onClick={() => setOpen((o) => !o)}
          className={`w-full min-w-[9rem] flex items-center justify-between gap-2 rounded-md border bg-input/40 px-2.5 py-1.5 text-xs text-left transition-smooth
            disabled:opacity-40 disabled:cursor-not-allowed
            ${open ? 'border-primary/60' : 'border-input hover:border-primary/40'}`}
        >
          <span className="truncate">
            {loading ? (
              <span className="text-muted-foreground inline-flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading…
              </span>
            ) : selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <span className="text-foreground">
                <span className="font-semibold text-primary">{selected.length}</span>
                <span className="text-muted-foreground"> of {options.length}</span>
              </span>
            )}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0 ${open ? 'rotate-180 text-primary' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-40 left-0 right-0 mt-1.5 min-w-[13rem] rounded-lg border border-border bg-popover shadow-xl overflow-hidden animate-scale-in">
            {options.length > 6 && (
              <div className="px-2 py-2 border-b border-border/60 bg-card/40">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  className="w-full rounded-md border border-input bg-input/40 px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
                />
              </div>
            )}
            <div className="max-h-56 overflow-y-auto scrollbar-thin">
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-[11px] text-muted-foreground italic text-center">
                  {q ? `No matches for "${query}"` : emptyLabel}
                </div>
              ) : (
                filtered.map((opt) => {
                  const active = selected.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggle(opt)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-left transition-smooth
                        ${active ? 'bg-primary/15 text-foreground' : 'text-foreground/80 hover:bg-secondary/40'}`}
                    >
                      <span className={`h-3.5 w-3.5 rounded border grid place-items-center shrink-0 transition-smooth
                        ${active ? 'bg-primary/30 border-primary/60' : 'border-border'}`}>
                        {active && <Check className="w-2.5 h-2.5 text-primary" />}
                      </span>
                      <span className="truncate">{opt}</span>
                    </button>
                  );
                })
              )}
            </div>
            <div className="flex items-center justify-between border-t border-border/60 px-2.5 py-1.5 bg-card/40 text-[10px] uppercase tracking-widest">
              <button
                type="button"
                onClick={selectAllFiltered}
                disabled={filtered.length === 0}
                className="text-primary hover:text-primary/80 disabled:opacity-30 disabled:cursor-not-allowed font-semibold"
              >
                Select {q ? 'filtered' : 'all'}
              </button>
              <span className="text-muted-foreground normal-case tracking-normal">
                {selected.length} / {options.length}
              </span>
              <button
                type="button"
                onClick={clearAll}
                disabled={selected.length === 0}
                className="text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed font-semibold"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
