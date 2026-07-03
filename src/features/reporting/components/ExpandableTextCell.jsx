import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, X } from 'lucide-react';

const POPOVER_WIDTH = 320;
const POPOVER_MAX_HEIGHT = 320;
const GAP = 4;
const PREVIEW_CHARS = 40;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Read-only expandable cell for long text (transcript, call summary). Shows a
// short preview in the cell and the full, wrapped text in a portal popover.
export default function ExpandableTextCell({ text, title = 'Details' }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  const value = useMemo(() => (text === null || text === undefined ? '' : String(text).trim()), [text]);

  const computePosition = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    // Dropdown behaviour: hang from the button. Left-align its left edge to the
    // button when there's room; if that overflows the right edge, right-align
    // (popover right edge = button right edge). Either way one edge stays locked
    // to the button and it opens directly below it.
    let left = rect.left;
    if (left + POPOVER_WIDTH > window.innerWidth - 8) {
      left = rect.right - POPOVER_WIDTH;
    }
    left = clamp(left, 8, Math.max(8, window.innerWidth - POPOVER_WIDTH - 8));
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < POPOVER_MAX_HEIGHT + GAP + 8 && rect.top > spaceBelow;
    // When opening above, anchor the popover's BOTTOM edge to the button so it
    // grows upward and stays glued to the button regardless of content height.
    if (showAbove) {
      setPos({ left, bottom: window.innerHeight - rect.top + GAP });
    } else {
      setPos({ left, top: rect.bottom + GAP });
    }
  }, []);

  // Outside click + Escape close; reposition on resize/scroll.
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
    window.addEventListener('scroll', onReflow, true);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
  }, [open, computePosition]);

  const togglePopover = () => {
    if (!open) computePosition();
    setOpen((v) => !v);
  };

  if (!value) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const preview = value.length > PREVIEW_CHARS ? `${value.slice(0, PREVIEW_CHARS)}…` : value;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={togglePopover}
        className="inline-flex items-center gap-1.5 h-7 max-w-full min-w-0 rounded-md border border-border bg-secondary/40 px-2 text-[11px] text-foreground/80 hover:text-foreground hover:bg-secondary transition-smooth"
        title={`View ${title.toLowerCase()}`}
      >
        <Eye className="w-3 h-3 text-primary shrink-0" />
        <span className="truncate min-w-0">{preview}</span>
      </button>

      {open && pos && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            ...(pos.top !== undefined ? { top: pos.top } : { bottom: pos.bottom }),
            left: pos.left,
            width: POPOVER_WIDTH,
            maxHeight: POPOVER_MAX_HEIGHT,
          }}
          className="z-[100] rounded-lg border border-border bg-popover shadow-[0_18px_50px_-10px_rgba(0,0,0,0.7)] flex flex-col"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{title}</span>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-smooth"
              aria-label="Close"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-y-auto scrollbar-thin p-3">
            <p className="text-[12px] leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
              {value}
            </p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
