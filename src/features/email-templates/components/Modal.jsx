import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4 animate-fade-in">
      <div className={`w-full ${wide ? 'max-w-3xl' : 'max-w-md'} rounded-2xl border border-white/10
        bg-gradient-to-b from-slate-900/90 to-slate-950/95
        shadow-[0_30px_120px_rgba(0,0,0,0.65)] overflow-y-auto max-h-[90vh] animate-pop-in`}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60 backdrop-blur">
          <h3 className="text-base font-semibold text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-lg border border-white/10 bg-white/5
              hover:bg-white/10 text-slate-400 hover:text-white transition-smooth active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
