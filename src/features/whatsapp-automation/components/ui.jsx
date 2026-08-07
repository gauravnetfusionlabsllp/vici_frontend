import { useState, useRef, useEffect } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';

/** Centered dialog. Matches the email-templates modal so the two admin pages feel the same. */
export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4 animate-fade-in">
      <div className={`w-full ${wide ? 'max-w-3xl' : 'max-w-md'} rounded-2xl border border-white/10
        bg-gradient-to-b from-slate-900/90 to-slate-950/95
        shadow-[0_30px_120px_rgba(0,0,0,0.65)] overflow-y-auto max-h-[90vh] animate-pop-in`}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60 backdrop-blur">
          <h3 className="text-base font-semibold text-slate-100">{title}</h3>
          <button onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-lg border border-white/10 bg-white/5
              hover:bg-white/10 text-slate-400 hover:text-white transition-smooth active:scale-90">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, hint, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-500 leading-relaxed">{hint}</p>}
    </div>
  );
}

export const inputClass =
  'w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-200 ' +
  'placeholder:text-slate-600 outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition';

export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={!!checked} disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 group disabled:opacity-50">
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition-smooth
        ${checked ? 'bg-emerald-500/80' : 'bg-slate-700'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-smooth
          ${checked ? 'left-[1.125rem]' : 'left-0.5'}`} />
      </span>
      {label && <span className="text-sm text-slate-300 group-hover:text-slate-100 transition">{label}</span>}
    </button>
  );
}

/** Chip-style multi-select over a known option list, with free-text entry for
 *  values that don't exist in meta_leads yet. Empty selection means "any". */
export function MultiSelect({ options = [], value = [], onChange, placeholder = 'Any' }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const toggle = (opt) =>
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);

  const addDraft = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft('');
  };

  const unlisted = value.filter((v) => !options.includes(v));

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className={`${inputClass} flex items-center justify-between gap-2 text-left`}>
        <span className="flex flex-wrap gap-1.5 min-h-[1.25rem] items-center">
          {value.length === 0
            ? <span className="text-slate-500">{placeholder}</span>
            : value.map((v) => (
                <span key={v} className="inline-flex items-center gap-1 rounded-md border border-sky-500/30
                  bg-sky-500/10 px-1.5 py-0.5 text-[11px] text-sky-200">
                  {v}
                  <X className="w-3 h-3 hover:text-white"
                    onClick={(e) => { e.stopPropagation(); onChange(value.filter((x) => x !== v)); }} />
                </span>
              ))}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-white/10 bg-slate-900
          shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden animate-fade-in">
          <div className="max-h-52 overflow-y-auto scrollbar-thin py-1">
            {options.length === 0 && unlisted.length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-500">No values found yet — type one below.</p>
            )}
            {[...options, ...unlisted].map((opt) => (
              <button key={opt} type="button" onClick={() => toggle(opt)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-300
                  hover:bg-white/5 transition">
                <span className={`h-4 w-4 shrink-0 rounded border grid place-items-center
                  ${value.includes(opt) ? 'border-sky-500 bg-sky-500/20' : 'border-white/15'}`}>
                  {value.includes(opt) && <Check className="w-3 h-3 text-sky-300" />}
                </span>
                <span className="truncate">{opt}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 border-t border-white/8 p-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDraft(); } }}
              placeholder="Add a value…"
              className="flex-1 rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-xs
                text-slate-200 placeholder:text-slate-600 outline-none focus:border-sky-500/50" />
            <button type="button" onClick={addDraft}
              className="rounded-md border border-sky-600/40 bg-sky-600/20 px-2 py-1 text-xs
                font-semibold text-sky-200 hover:bg-sky-600/30 transition">Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_TONE = {
  sent:     'text-emerald-300 bg-emerald-500/12 border-emerald-500/25',
  failed:   'text-rose-300 bg-rose-500/12 border-rose-500/25',
  no_match: 'text-amber-300 bg-amber-500/12 border-amber-500/25',
  skipped:  'text-slate-400 bg-slate-500/12 border-slate-500/25',
  pending:  'text-sky-300 bg-sky-500/12 border-sky-500/25',
};

export function StatusBadge({ status }) {
  const tone = STATUS_TONE[status] || STATUS_TONE.skipped;
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${tone}`}>
      {String(status || '—').replace('_', ' ')}
    </span>
  );
}
