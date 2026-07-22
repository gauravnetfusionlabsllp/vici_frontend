import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X, Download, Loader2, MessageSquare, Star, Headphones, Gauge, Megaphone, UserCheck, Database } from 'lucide-react';

import { useDownloadRecordingMutation } from '@/services';
import { useToast } from '@/shared/hooks/useToast';
import RecordingPlayer from '@/features/reporting/components/RecordingPlayer';
import BoolBadge from '@/features/reporting/components/BoolBadge';
import { selectMaskPii } from '@/features/auth/slices/authSlice';
import { maskEmail, maskPhone } from '@/shared/lib/mask';
import { dash, fmtDateTime, fmtDuration, toContactArray } from '../utils';

function fileSafe(v) {
  return String(v ?? '').trim().replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '');
}

const SENTIMENT_TONE = {
  positive: 'text-[hsl(var(--status-active))] border-[hsl(var(--status-active)/0.35)] bg-[hsl(var(--status-active)/0.12)]',
  negative: 'text-destructive border-destructive/35 bg-destructive/12',
  neutral: 'text-muted-foreground border-border bg-secondary/40',
};

// A labeled sub-section with a hairline header, one consistent look across the modal.
function Group({ title, icon: Icon, children, className = '' }) {
  return (
    <section className={className}>
      <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-border/60">
        {Icon && <Icon className="w-3.5 h-3.5 text-primary" />}
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">{title}</h4>
      </div>
      {children}
    </section>
  );
}

// Label-over-value definition item.
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-xs text-foreground/90 break-words">{children}</span>
    </div>
  );
}

function SentimentBadge({ label, value }) {
  const tone = SENTIMENT_TONE[String(value || '').toLowerCase()] || SENTIMENT_TONE.neutral;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={`inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize ${tone}`}>
        {dash(value)}
      </span>
    </div>
  );
}

function Stars({ value }) {
  if (value == null) return <span className="text-xs text-muted-foreground">—</span>;
  const n = Math.round(Number(value) || 0);
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < n ? 'text-[hsl(var(--status-waiting))] fill-[hsl(var(--status-waiting))]' : 'text-border'}`} />
      ))}
    </span>
  );
}

function KeyValueDump({ title, obj }) {
  const entries = obj && typeof obj === 'object' ? Object.entries(obj) : [];
  if (entries.length === 0) return null;
  return (
    <Group title={title} icon={Database}>
      <div className="rounded-lg border border-border/60 bg-secondary/20 divide-y divide-border/40">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-start gap-3 px-2.5 py-1.5">
            <span className="w-40 shrink-0 text-[11px] text-muted-foreground break-words">{k}</span>
            <span className="flex-1 text-[11px] text-foreground/90 break-words">
              {v === null || v === undefined || v === ''
                ? '—'
                : typeof v === 'object'
                  ? JSON.stringify(v)
                  : String(v)}
            </span>
          </div>
        ))}
      </div>
    </Group>
  );
}

export default function CallDetailModal({ call, onClose }) {
  const { error: toastError } = useToast();
  const maskPii = useSelector(selectMaskPii);
  const [triggerDownload, { isLoading: downloading }] = useDownloadRecordingMutation();

  // Esc to close + lock background scroll while open.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (!call) return null;

  const contacts = toContactArray(call.how_contacted);

  const handleDownload = async () => {
    if (!call.recording_link || downloading) return;
    const agent = call.agent_name || call.agent_user;
    try {
      const objectUrl = await triggerDownload({
        recordingLink: call.recording_link,
        agentName: agent,
        phone: call.phone,
      }).unwrap();
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${fileSafe(agent) || 'recording'}_${fileSafe(call.phone)}.mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      toastError('Could not download the recording.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-3xl max-h-[88vh] rounded-xl border border-border bg-card shadow-2xl flex flex-col animate-pop-in"
      >
        {/* Header (pinned) */}
        <div className="flex items-start justify-between gap-3 px-5 py-3.5 border-b border-border">
          <div className="min-w-0">
            <div className="text-[10px] text-primary uppercase tracking-widest mb-1">Call #{dash(call.call_id)}</div>
            <div className="text-sm font-semibold text-foreground truncate">{dash(call.name)}</div>
            <div className="text-xs font-mono text-muted-foreground mt-0.5">{call.phone ? (maskPii ? maskPhone(call.phone) : call.phone) : '—'}</div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex flex-col items-end gap-1">
              {call.call_outcome && (
                <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                  {call.call_outcome}
                </span>
              )}
              <Stars value={call.call_stars} />
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 grid place-items-center rounded-lg border border-border bg-secondary/60 text-muted-foreground hover:text-foreground transition-smooth active:scale-90"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body (scroll) */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-5">
          {/* Recording */}
          <Group title="Recording" icon={Headphones}>
            {call.recording_link ? (
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5">
                <RecordingPlayer src={call.recording_link} title={call.recording_filename || 'Call recording'} lengthSec={call.length_in_sec} />
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth shrink-0 disabled:opacity-50"
                  title="Download recording"
                >
                  {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                </button>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground italic">No recording available.</div>
            )}
          </Group>

          {/* Call Quality */}
          <Group title="Call Quality" icon={Gauge}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Call Date">{fmtDateTime(call.call_date)}</Field>
              <Field label="Duration">{fmtDuration(call.length_in_sec)}</Field>
              <Field label="Outcome">{dash(call.call_outcome)}</Field>
              <Field label="Rating">{call.overall_rating != null ? `${call.overall_rating}/10` : '—'}</Field>
              <Field label="Stars"><Stars value={call.call_stars} /></Field>
              <Field label="Dialer Status">{dash(call.vici_lead_status)}</Field>
              <SentimentBadge label="Agent Sentiment" value={call.agent_sentiment} />
              <SentimentBadge label="Client Sentiment" value={call.client_sentiment} />
            </div>
          </Group>

          {/* Lead / Meta */}
          <Group title="Lead / Meta" icon={Megaphone}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Campaign">{dash(call.campaign_name)}</Field>
              <Field label="Source">{dash(call.source)}</Field>
              <Field label="Form">{dash(call.form_name)}</Field>
              <Field label="Ad">{dash(call.ad_name)}</Field>
              <Field label="Ad Set">{dash(call.ad_set_name)}</Field>
              <Field label="Email">{call.email ? (maskPii ? maskEmail(call.email) : call.email) : '—'}</Field>
              <Field label="Lead Created">{fmtDateTime(call.lead_created_at)}</Field>
            </div>
          </Group>

          {/* Follow-up */}
          <Group title="Follow-up" icon={UserCheck}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-start">
              <Field label="Response">{dash(call.response)}</Field>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Registered</span>
                <BoolBadge value={call.client_registered} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Deposited</span>
                <BoolBadge value={call.client_deposited} />
              </div>
            </div>
            {contacts.length > 0 && (
              <div className="mt-3">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Contacted Via</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {contacts.map((c) => (
                    <span key={c} className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] text-primary">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Group>

          {/* Summary */}
          <Group title="Call Summary" icon={MessageSquare}>
            <p className="text-xs text-foreground/85 leading-relaxed whitespace-pre-wrap rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5">
              {call.call_summary ? call.call_summary : '—'}
            </p>
          </Group>

          {/* Raw dumps */}
          <KeyValueDump title="Form Details (raw_data)" obj={call.raw_data} />
          <KeyValueDump title="Custom Fields" obj={call.custom_fields} />
        </div>
      </div>
    </div>
  );
}
