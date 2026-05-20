import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, X, Mail, Paperclip, Search } from 'lucide-react';

export default function TemplateSelector({
  templates,
  value,
  onSelect,
  onClear,
  isLoading,
  error,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', handle);
    return () => window.removeEventListener('mousedown', handle);
  }, [open]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return templates;
    return templates.filter((t) =>
      (t.name || '').toLowerCase().includes(needle) ||
      (t.subject || '').toLowerCase().includes(needle)
    );
  }, [q, templates]);

  const selected = useMemo(
    () => templates.find((t) => t.id === value) || null,
    [templates, value]
  );

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        Could not load templates
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-slate-950/40
          px-3 py-2 text-sm text-foreground hover:border-primary/30 transition focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Mail className="w-4 h-4 text-primary shrink-0" />
          {selected ? (
            <span className="flex items-center gap-2 min-w-0">
              <span className="text-foreground font-medium truncate">{selected.name}</span>
              <span className="text-muted-foreground text-xs truncate hidden sm:inline">— {selected.subject}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              {isLoading ? 'Loading templates…' : 'Select a template (optional)'}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear?.(); }}
              className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-destructive"
              aria-label="Clear template"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1.5 rounded-xl border border-white/10 bg-card shadow-[0_30px_80px_rgba(0,0,0,0.55)] animate-fade-in-down overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search templates…"
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/70"
            />
          </div>
          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">No templates match.</p>
            ) : (
              filtered.map((t) => {
                const isSel = t.id === value;
                const count = t.attachments?.length ?? 0;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { onSelect(t); setOpen(false); setQ(''); }}
                    className={`w-full text-left flex items-start gap-3 px-3 py-2.5 border-b border-white/5 last:border-b-0
                      transition ${isSel ? 'bg-primary/10' : 'hover:bg-white/5'}`}
                  >
                    <div className={`h-8 w-8 shrink-0 rounded-lg grid place-items-center
                      ${isSel ? 'bg-primary/20 border border-primary/40' : 'bg-slate-800/60 border border-white/10'}`}>
                      <Mail className={`w-3.5 h-3.5 ${isSel ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground font-medium truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.subject}</p>
                    </div>
                    {count > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                        <Paperclip className="w-3 h-3" /> {count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
