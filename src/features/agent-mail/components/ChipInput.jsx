import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { isValidEmail } from '../utils/placeholders';

export default function ChipInput({
  values,
  onChange,
  placeholder = 'name@example.com',
  ariaLabel,
}) {
  const [input, setInput] = useState('');
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef(null);

  const commit = (raw) => {
    const v = raw.trim().replace(/[,;]+$/, '');
    if (!v) return;
    if (!isValidEmail(v)) { setInvalid(true); return; }
    if (values.includes(v)) { setInput(''); return; }
    onChange([...values, v]);
    setInput('');
    setInvalid(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      commit(input);
    } else if (e.key === 'Backspace' && !input && values.length) {
      onChange(values.slice(0, -1));
    } else if (invalid) {
      setInvalid(false);
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text');
    if (!text.includes(',') && !text.includes(';') && !text.includes('\n')) return;
    e.preventDefault();
    const tokens = text.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
    const additions = [];
    let sawInvalid = false;
    for (const t of tokens) {
      if (!isValidEmail(t)) { sawInvalid = true; continue; }
      if (!values.includes(t) && !additions.includes(t)) additions.push(t);
    }
    if (additions.length) onChange([...values, ...additions]);
    if (sawInvalid) setInvalid(true);
  };

  const remove = (v) => onChange(values.filter((x) => x !== v));

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={`flex flex-wrap items-center gap-1.5 rounded-lg border bg-slate-950/40 px-2 py-1.5
        cursor-text transition focus-within:ring-2 focus-within:ring-primary/30
        ${invalid ? 'border-destructive/60' : 'border-white/10 focus-within:border-primary/40'}`}
      aria-label={ariaLabel}
    >
      {values.map((v) => (
        <span key={v} className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-xs text-primary-foreground">
          <span className="text-foreground/90">{v}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); remove(v); }}
            className="text-muted-foreground hover:text-destructive transition-smooth"
            aria-label={`Remove ${v}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => input && commit(input)}
        onPaste={handlePaste}
        placeholder={values.length ? '' : placeholder}
        className="flex-1 min-w-[140px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/70 py-0.5"
      />
    </div>
  );
}
