import { CheckCircle2, Mail, Paperclip, History, RotateCcw } from 'lucide-react';

export default function SentView({ result, onComposeAnother, onViewHistory }) {
  if (!result) return null;
  const to = Array.isArray(result.to) ? result.to : [result.to].filter(Boolean);

  return (
    <div className="max-w-xl mx-auto py-8 px-3 text-center space-y-5 animate-fade-in-up">
      <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 grid place-items-center animate-pop-in">
        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">Email sent successfully</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your message has been delivered to the recipient{to.length > 1 ? 's' : ''}.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/60 p-4 text-left space-y-2">
        <Row label="Subject" value={result.subject} />
        <Row label="To" value={to.join(', ')} />
        {result.recipient_name && <Row label="Recipient" value={result.recipient_name} />}
        {result.lead_id != null && <Row label="Lead ID" value={`#${result.lead_id}`} />}
        {result.template_used && <Row label="Template" value={result.template_used} />}
        {result.attachments_sent != null && (
          <Row
            label="Attachments"
            value={
              <span className="inline-flex items-center gap-1.5 text-foreground">
                <Paperclip className="w-3 h-3 text-muted-foreground" />
                {result.attachments_sent}
              </span>
            }
          />
        )}
        {result.sent_by && <Row label="Sent by" value={result.sent_by} />}
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onViewHistory}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-foreground hover:bg-white/10 text-sm transition"
        >
          <History className="w-4 h-4" /> View history
        </button>
        <button
          type="button"
          onClick={onComposeAnother}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-primary/40 bg-primary/20 text-primary
            font-semibold text-sm hover:bg-primary/30 transition active:scale-[0.97]"
        >
          <RotateCcw className="w-4 h-4" /> Send another
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground w-20 shrink-0 mt-0.5">{label}</span>
      <span className="text-foreground min-w-0 break-words flex-1">{value}</span>
    </div>
  );
}
