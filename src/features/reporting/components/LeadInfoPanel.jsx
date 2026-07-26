import { useSelector } from 'react-redux';
import { Download, Loader2, MessageSquare, Star, Headphones, Gauge, Megaphone, UserCheck, Database } from 'lucide-react';

import { useDownloadRecordingMutation } from '@/services';
import { useToast } from '@/shared/hooks/useToast';
import { selectMaskPii } from '@/features/auth/slices/authSlice';
import { maskEmail } from '@/shared/lib/mask';
import { dash, fmtDateTime, fmtDuration, toContactArray } from '@/features/manager-view/utils';
import { dispositionLabel } from '../utils';
import RecordingPlayer from './RecordingPlayer';
import BoolBadge from './BoolBadge';

function fileSafe(v) {
  return String(v ?? '').trim().replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '');
}

// raw_data / custom_fields may arrive as an object or a JSON string — normalize to an object.
function asObject(v) {
  if (v && typeof v === 'object') return v;
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

// A labeled sub-section with a hairline header, one consistent look wherever lead detail is shown.
export function Group({ title, icon: Icon, children, className = '' }) {
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
export function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-xs text-foreground/90 break-words">{children}</span>
    </div>
  );
}

export function Stars({ value }) {
  if (value == null || value === '') return <span className="text-xs text-muted-foreground">—</span>;
  const n = Math.round(Number(value) || 0);
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < n ? 'text-[hsl(var(--status-waiting))] fill-[hsl(var(--status-waiting))]' : 'text-border'}`} />
      ))}
    </span>
  );
}

export function KeyValueDump({ title, obj }) {
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

// Rich lead-detail body (Hot Meta Lead shape). Rendered inside the reporting row-click modal and the
// WhatsApp admin console. `children` is an optional slot placed between Follow-up and Call Summary
// (the modal drops its WhatsApp thread there). Returns a fragment — the consumer supplies the
// spacing/scroll wrapper (e.g. `space-y-5`).
export default function LeadInfoPanel({ lead, children }) {
  const { error: toastError } = useToast();
  const maskPii = useSelector(selectMaskPii);
  const [triggerDownload, { isLoading: downloading }] = useDownloadRecordingMutation();

  if (!lead) return null;

  const agent = lead.vici_call_agent || lead.agent_name || lead.agent_user;
  const dispo = dispositionLabel(lead.vici_call_status);
  const contacts = toContactArray(lead.how_contacted);

  const handleDownload = async () => {
    if (!lead.recording_link || downloading) return;
    try {
      const objectUrl = await triggerDownload({
        recordingLink: lead.recording_link,
        agentName: agent,
        phone: lead.phone,
      }).unwrap();
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${fileSafe(agent) || 'recording'}_${fileSafe(lead.phone)}.mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      toastError('Could not download the recording.');
    }
  };

  return (
    <>
      {/* Recording */}
      <Group title="Recording" icon={Headphones}>
        {lead.recording_link ? (
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5">
            <RecordingPlayer src={lead.recording_link} title={lead.recording_filename || 'Call recording'} lengthSec={lead.length_in_sec} />
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
          <Field label="Call Date">{fmtDateTime(lead.call_date)}</Field>
          <Field label="Duration">{fmtDuration(lead.length_in_sec)}</Field>
          <Field label="Disposition">{dash(dispo)}</Field>
          <Field label="Rating"><Stars value={lead.call_rating} /></Field>
          <Field label="First Status">{fmtDateTime(lead.first_status_change)}</Field>
          <Field label="Latest Status">{fmtDateTime(lead.last_status_change)}</Field>
        </div>
      </Group>

      {/* Lead / Meta */}
      <Group title="Lead / Meta" icon={Megaphone}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Campaign">{dash(lead.campaign_name)}</Field>
          <Field label="Form">{dash(lead.form_name)}</Field>
          <Field label="Ad">{dash(lead.ad_name)}</Field>
          <Field label="Ad Set">{dash(lead.ad_set_name)}</Field>
          <Field label="Email">{lead.email ? (maskPii ? maskEmail(lead.email) : lead.email) : '—'}</Field>
          <Field label="Created">{fmtDateTime(lead.inserted_date)}</Field>
        </div>
      </Group>

      {/* Follow-up */}
      <Group title="Follow-up" icon={UserCheck}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-start">
          <Field label="Agent">{dash(agent)}</Field>
          <Field label="Call Response">{dash(lead.vici_call_comments)}</Field>
          <Field label="Follow-up Response">{dash(lead.response)}</Field>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Registered</span>
            <BoolBadge value={lead.client_registered} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Deposited</span>
            <BoolBadge value={lead.client_deposited} />
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

      {/* Optional slot (the modal drops its WhatsApp thread here). */}
      {children}

      {/* Summary */}
      <Group title="Call Summary" icon={MessageSquare}>
        <p className="text-xs text-foreground/85 leading-relaxed whitespace-pre-wrap rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5">
          {lead.call_summary ? lead.call_summary : '—'}
        </p>
      </Group>

      {/* Raw dumps */}
      <KeyValueDump title="Form Details (raw_data)" obj={asObject(lead.raw_data)} />
      <KeyValueDump title="Custom Fields" obj={asObject(lead.custom_fields)} />
    </>
  );
}
