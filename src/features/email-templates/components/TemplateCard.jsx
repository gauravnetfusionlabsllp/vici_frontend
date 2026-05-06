import { Mail, Eye, Pencil, Trash2 } from 'lucide-react';
import { getFileIcon } from '../utils';

export default function TemplateCard({ tpl, onEdit, onDelete, onView }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/8
      bg-gradient-to-b from-slate-900/60 to-slate-950/70
      hover:border-white/[0.14] transition-all duration-200
      shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
        bg-[radial-gradient(400px_circle_at_0%_0%,rgba(56,189,248,0.06),transparent_60%)]" />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-xl border border-white/10 bg-slate-800/60 grid place-items-center">
              <Mail className="w-4 h-4 text-sky-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-100 truncate">{tpl.name}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{tpl.subject}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onView(tpl)} title="Preview"
              className="h-8 w-8 grid place-items-center rounded-lg border border-white/10 bg-white/5
                text-slate-400 hover:text-sky-300 hover:border-sky-500/30 hover:bg-sky-500/10 transition">
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onEdit(tpl)} title="Edit"
              className="h-8 w-8 grid place-items-center rounded-lg border border-white/10 bg-white/5
                text-slate-400 hover:text-amber-300 hover:border-amber-500/30 hover:bg-amber-500/10 transition">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(tpl)} title="Delete"
              className="h-8 w-8 grid place-items-center rounded-lg border border-white/10 bg-white/5
                text-slate-400 hover:text-rose-300 hover:border-rose-500/30 hover:bg-rose-500/10 transition">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {tpl.body || 'No body content.'}
        </p>

        {tpl.attachments?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tpl.attachments.map((a) => (
              <span key={a.id} className="inline-flex items-center gap-1.5 rounded-md border border-white/8 bg-slate-800/60 px-2 py-0.5 text-xs text-slate-400">
                {getFileIcon(a)}
                <span className="max-w-[120px] truncate">{a.original_name}</span>
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-600 border-t border-white/6 pt-3">
          <span>ID: {tpl.id}</span>
          <span>{tpl.attachments?.length ?? 0} attachment{tpl.attachments?.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}
