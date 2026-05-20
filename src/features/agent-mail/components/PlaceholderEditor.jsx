import { Braces } from 'lucide-react';

export default function PlaceholderEditor({ tokens, values, onChange }) {
  if (!tokens.length) return null;

  const setValue = (key, val) => onChange({ ...values, [key]: val });

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3 space-y-2 animate-fade-in">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
        <Braces className="w-3.5 h-3.5" />
        Placeholders ({tokens.length})
      </div>
      <p className="text-[11px] text-muted-foreground">
        Fill in values for every <code className="text-primary/80">{'{{token}}'}</code> found in the subject and body.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {tokens.map((key) => {
          const empty = !values[key];
          return (
            <label key={key} className="space-y-1 block">
              <span className={`text-[10px] uppercase tracking-widest ${empty ? 'text-amber-400' : 'text-muted-foreground'}`}>
                {key}
              </span>
              <input
                value={values[key] ?? ''}
                onChange={(e) => setValue(key, e.target.value)}
                placeholder={`Value for ${key}`}
                className={`w-full rounded-md border bg-slate-950/40 px-2.5 py-1.5 text-sm text-foreground
                  placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition
                  ${empty ? 'border-amber-500/30' : 'border-white/10'}`}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
