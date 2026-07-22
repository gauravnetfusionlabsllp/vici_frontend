import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { Check, Eye, X } from 'lucide-react';
import { selectMaskPii } from '@/features/auth/slices/authSlice';
import { maskEmail, maskPhone } from '@/shared/lib/mask';

const POPOVER_WIDTH = 380;
const POPOVER_MAX_HEIGHT = 360;
const GAP = 6;

// "what_is_your_planned_starting_investment?" → "What Is Your Planned Starting Investment"
function humanizeKey(k) {
  return k
    .replace(/[_-]+/g, ' ')
    .replace(/[?:]+\s*$/g, '')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Replace the form-style underscore-as-space, but keep emails / URLs / phone numbers untouched.
function prettyValue(v) {
  if (v === null || v === undefined) return '—';
  if (typeof v !== 'string') return String(v);
  const s = v.trim();
  if (!s) return '—';
  const isEmail = /@/.test(s) && !/\s/.test(s);
  const isUrl   = /^https?:\/\//i.test(s);
  const isPhone = /^\+?\d[\d\s().-]{5,}$/.test(s);
  if (isEmail || isUrl || isPhone) return s;
  return s.replace(/_/g, ' ');
}

// When masking is on, mask any email / phone value; otherwise show the pretty value.
function displayValue(v, maskPii) {
  if (maskPii && typeof v === 'string') {
    const s = v.trim();
    const isEmail = /@/.test(s) && !/\s/.test(s);
    const isPhone = /^\+?\d[\d\s().-]{5,}$/.test(s);
    if (isEmail) return maskEmail(s);
    if (isPhone) return maskPhone(s);
  }
  return prettyValue(v);
}

function valueKindCls(v) {
  if (typeof v !== 'string') return 'text-foreground/90';
  if (/@/.test(v) && !/\s/.test(v)) return 'text-primary font-mono';
  if (/^\+?\d[\d\s().-]{5,}$/.test(v)) return 'text-primary font-mono';
  if (/^https?:\/\//i.test(v)) return 'text-primary underline-offset-2 hover:underline';
  return 'text-foreground/90';
}

function parseData(data) {
  if (!data) return null;
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return data; }
  }
  return data;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function RawDataCell({ data }) {
  const maskPii = useSelector(selectMaskPii);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  const parsed = useMemo(() => parseData(data), [data]);

  const entries = useMemo(() => {
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.entries(parsed);
    }
    return null;
  }, [parsed]);

  const computePosition = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const left = clamp(rect.left, 8, window.innerWidth - POPOVER_WIDTH - 8);
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < POPOVER_MAX_HEIGHT + GAP + 8 && rect.top > spaceBelow;
    const top = showAbove ? rect.top - POPOVER_MAX_HEIGHT - GAP : rect.bottom + GAP;
    setPos({ top, left });
  }, []);

  // Outside click + Escape close
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (
        popoverRef.current?.contains(e.target) ||
        triggerRef.current?.contains(e.target)
      ) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onReflow = () => computePosition();
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onReflow);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onReflow);
    };
  }, [open, computePosition]);

  const togglePopover = () => {
    if (!open) computePosition();
    setOpen((v) => !v);
  };

  
  if (!parsed) return <span className="text-xs text-muted-foreground">—</span>;

  const fieldCount = entries ? entries.length : null;
  const firstKey = entries?.[0]?.[0];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={togglePopover}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2 py-0.5 text-[11px] text-foreground/80 hover:text-foreground hover:bg-secondary transition-smooth"
        title="View raw data"
      >
        <Eye className="w-3 h-3 text-primary" />
        {entries ? (
          <>
            <span className="font-mono-nums">{fieldCount}</span>
            <span className="text-muted-foreground">{fieldCount === 1 ? 'field' : 'fields'}</span>
            {firstKey && (
              <span className="text-muted-foreground/70 truncate max-w-[100px] hidden md:inline">
                · {humanizeKey(firstKey)}
              </span>
            )}
          </>
        ) : (
          <span className="truncate max-w-[140px]">{String(parsed).slice(0, 40)}</span>
        )}
      </button>

      {open && pos && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: POPOVER_WIDTH,
            maxHeight: POPOVER_MAX_HEIGHT,
          }}
          className="z-[100] rounded-lg border border-border bg-popover shadow-[0_18px_50px_-10px_rgba(0,0,0,0.7)] animate-fade-in flex flex-col"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Raw data</span>
              {entries && (
                <span className="font-mono-nums text-foreground/70">
                  {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
             
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-smooth"
                aria-label="Close"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto scrollbar-thin p-1">
            {entries ? (
              <dl className="divide-y divide-border/40">
                {entries.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-2 px-2 py-1.5 hover:bg-secondary/40 rounded-sm">
                    <dt className="text-[11px] " title={k}>
                      {humanizeKey(k)}
                    </dt>
                    <dd className={`text-[11px]  ${valueKindCls(v)}`}>
                      {displayValue(v, maskPii)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <pre className="px-2 py-1.5 text-[11px] font-mono whitespace-pre-wrap break-all text-foreground/90">
                {String(parsed)}
              </pre>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
