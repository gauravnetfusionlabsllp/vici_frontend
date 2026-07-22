import { useSelector } from 'react-redux';
import { ArrowLeft, Send, Loader2, Lock, Paperclip } from 'lucide-react';
import { getFileIcon } from '@/features/email-templates/utils';
import { selectMaskPii } from '@/features/auth/slices/authSlice';
import { maskEmail } from '@/shared/lib/mask';
import { fillText } from '../utils/placeholders';
import { fmtSize } from '../utils/format';

export default function PreviewView({
  form,
  attachments,
  officeEmail,
  onBack,
  onSend,
  sending,
}) {
  const maskPii = useSelector(selectMaskPii);
  const subjectRendered = fillText(form.subject, form.placeholders);
  const bodyRendered = fillText(form.body, form.placeholders);
  const selectedFiles = attachments.filter((a) => form.attachIds.includes(a.id));
  const fmtAddrs = (arr) => (maskPii ? arr.map(maskEmail) : arr).join(', ');

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-950/40 divide-y divide-white/10">
        {[
          { label: 'From', value: (
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <Lock className="w-3 h-3 text-muted-foreground" /> {officeEmail}
            </span>
          ) },
          { label: 'To', value: fmtAddrs(form.toEmails) || '—' },
          ...(form.cc.length ? [{ label: 'Cc', value: fmtAddrs(form.cc) }] : []),
          { label: 'Subject', value: subjectRendered || '—' },
          ...(form.recipientName || form.leadId ? [{
            label: 'Lead',
            value: (
              <span className="text-foreground">
                {form.recipientName || '—'}
                {form.leadId ? <span className="text-muted-foreground"> · #{form.leadId}</span> : null}
              </span>
            ),
          }] : []),
        ].map(({ label, value }) => (
          <div key={label} className="flex items-start gap-4 px-4 py-3">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground w-16 shrink-0 mt-0.5">{label}</span>
            <span className="text-sm text-foreground min-w-0 break-words">{value}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/30">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Body Preview</span>
          {form.tplName && (
            <span className="text-[11px] text-muted-foreground">via <span className="text-foreground">{form.tplName}</span></span>
          )}
        </div>
        <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-[1.8] px-4 py-4 max-h-[42vh] overflow-y-auto scrollbar-thin">
          {bodyRendered || <span className="text-muted-foreground italic">No body content.</span>}
        </pre>
      </div>

      {selectedFiles.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-slate-950/30">
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
            <Paperclip className="w-3.5 h-3.5" /> Attachments ({selectedFiles.length})
          </div>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {selectedFiles.map((a) => (
              <div key={a.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2">
                {getFileIcon(a)}
                <div className="min-w-0">
                  <p className="text-xs text-foreground font-medium truncate">{a.original_name}</p>
                  <p className="text-[10px] text-muted-foreground">{fmtSize(a.file_size)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 md:-mx-5 px-4 md:px-5 py-3 border-t border-white/10
        bg-card/80 backdrop-blur-md flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={sending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-foreground hover:bg-white/10 text-sm transition disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" /> Back to edit
        </button>
        <button
          type="button"
          onClick={onSend}
          disabled={sending}
          className="flex items-center gap-2 px-5 py-2 rounded-lg border border-primary/50 bg-primary text-primary-foreground
            font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-60 active:scale-[0.97]"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? 'Sending…' : 'Send email'}
        </button>
      </div>
    </div>
  );
}
