import { useEffect } from 'react';
import AgentMailApp from './AgentMailApp';

/**
 * Renders <AgentMailApp /> inside a centered, full-screen-ish modal layer.
 * Use this when opening compose from inside another popup (e.g. call
 * disposition) so the parent popup's state survives.
 *
 * Sits at z-[60] — one level above CallDispositionPopup (z-50).
 */
export default function AgentMailModal({ open, onClose, ...props }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center
                 bg-black/70 backdrop-blur-md p-2 sm:p-6 animate-fade-in overflow-y-auto"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[1100px] my-auto animate-pop-in">
        <AgentMailApp {...props} onClose={onClose} />
      </div>
    </div>
  );
}
