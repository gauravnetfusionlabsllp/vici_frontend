import { Loader2, Check } from 'lucide-react';
import { useGetEmailAttachmentsQuery } from '@/services';
import { getFileIcon } from '../utils';

export default function AttachmentPicker({ selectedIds, onChange }) {
  const { data: attachments = [], isLoading } = useGetEmailAttachmentsQuery();

  const toggle = (id) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  };

  if (isLoading) return (
    <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading attachments…
    </div>
  );

  if (!attachments.length) return (
    <p className="text-xs text-slate-500 py-3 italic">
      No attachments uploaded yet. Upload files in the Attachments tab first.
    </p>
  );

  return (
    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
      {attachments.map((att) => {
        const isSelected = selectedIds.includes(att.id);
        return (
          <button
            key={att.id}
            type="button"
            onClick={() => toggle(att.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition
              ${isSelected
                ? 'border-sky-500/40 bg-sky-500/10'
                : 'border-white/8 bg-slate-950/30 hover:bg-white/5'
              }`}
          >
            <div className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition
              ${isSelected ? 'bg-sky-500 border-sky-400' : 'border-white/20'}`}>
              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            {getFileIcon(att)}
            <span className="text-sm text-slate-300 truncate flex-1">{att.original_name}</span>
            <span className="text-xs text-slate-600 shrink-0">ID {att.id}</span>
          </button>
        );
      })}
    </div>
  );
}
