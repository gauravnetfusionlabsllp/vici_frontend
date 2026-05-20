import { useState, useMemo } from 'react';
import { Search, Paperclip, Check, Loader2 } from 'lucide-react';
import { getFileIcon } from '@/features/email-templates/utils';
import { fmtSize } from '../utils/format';

export default function AttachmentSidebar({
  attachments,
  selectedIds,
  onToggle,
  isLoading,
}) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return attachments;
    return attachments.filter((a) =>
      (a.original_name || '').toLowerCase().includes(needle) ||
      (a.description || '').toLowerCase().includes(needle)
    );
  }, [attachments, q]);

  return (
    <aside className="h-full flex flex-col rounded-2xl border border-white/10 bg-card/60 overflow-hidden">
      <div className="px-3 py-3 border-b border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-primary" /> Attachments
          </h3>
          {selectedIds.length > 0 && (
            <span className="text-[11px] font-medium rounded-full bg-primary/15 border border-primary/30 text-primary px-2 py-0.5">
              {selectedIds.length} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/40 px-2 py-1.5">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search files…"
            className="flex-1 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1.5">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-8">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading files…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-8">
            {attachments.length === 0 ? 'No files available' : 'No files match your search'}
          </div>
        ) : (
          filtered.map((a) => {
            const isSel = selectedIds.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onToggle(a.id)}
                className={`w-full flex items-start gap-2 rounded-lg border px-2 py-2 text-left transition
                  ${isSel
                    ? 'border-primary/40 bg-primary/10'
                    : 'border-white/8 bg-slate-950/30 hover:bg-white/5 hover:border-white/14'}`}
              >
                <div className={`w-4 h-4 mt-0.5 rounded border shrink-0 flex items-center justify-center transition
                  ${isSel ? 'bg-primary border-primary' : 'border-white/20'}`}>
                  {isSel && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                </div>
                <div className="shrink-0 mt-0.5">{getFileIcon(a)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground font-medium truncate">{a.original_name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {fmtSize(a.file_size)}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
