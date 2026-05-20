import { useState, useEffect, useMemo, useRef } from 'react';
import { Mail, History, X } from 'lucide-react';
import {
  useGetAgentEmailTemplatesQuery,
  useGetAgentEmailAttachmentsQuery,
  useGetAgentLeadEmailQuery,
  useSendAgentEmailMutation,
} from '@/services';
import { useToast } from '@/shared/hooks/useToast';
import ComposeView from './components/ComposeView';
import PreviewView from './components/PreviewView';
import SentView from './components/SentView';
import HistoryView from './components/HistoryView';
import AttachmentSidebar from './components/AttachmentSidebar';
import { fillText, isValidEmail } from './utils/placeholders';

const emptyForm = {
  toEmails: [],
  cc: [],
  templateId: '',
  tplName: '',
  subject: '',
  body: '',
  attachIds: [],
  placeholders: {},
  leadId: null,
  recipientName: '',
};

export default function AgentMailApp({
  leadId = null,
  officeEmail = 'office@spectra.com',
  onClose,
  /**
   * Optional initial form values. Useful when the caller already knows the
   * recipient (e.g. opened from the call screen with the lead's email/name
   * in hand) — skips the /email/agent/lead/:id/email fetch.
   */
  prefill = null,
}) {
  const { error } = useToast();

  const initialForm = useMemo(() => {
    if (!prefill) return { ...emptyForm, leadId };
    return {
      ...emptyForm,
      leadId: prefill.leadId ?? leadId,
      toEmails: prefill.toEmails ?? [],
      cc: prefill.cc ?? [],
      recipientName: prefill.recipientName ?? '',
      placeholders: prefill.placeholders ?? {},
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [view, setView] = useState('compose'); // compose | preview | sent | history
  const [form, setForm] = useState(initialForm);
  const [sentResult, setSentResult] = useState(null);

  // ── Fetch data ─────────────────────────────────────────────────────
  const {
    data: templates = [],
    isLoading: templatesLoading,
    error: templatesError,
  } = useGetAgentEmailTemplatesQuery();

  const {
    data: attachments = [],
    isLoading: attachmentsLoading,
  } = useGetAgentEmailAttachmentsQuery();

  // If the caller already pre-filled the recipient, skip the lead-email
  // fetch — we trust the data they handed us.
  const skipLeadFetch = !form.leadId || (prefill?.toEmails?.length > 0);

  const {
    data: leadData,
    isFetching: leadLoading,
  } = useGetAgentLeadEmailQuery(form.leadId, { skip: skipLeadFetch });

  // Apply lead data once per fetched lead. Ref guard prevents reapplying
  // after the agent edits the recipient/placeholders manually.
  const appliedLeadRef = useRef(null);
  useEffect(() => {
    if (!leadData) return;
    if (appliedLeadRef.current === leadData.lead_id) return;
    appliedLeadRef.current = leadData.lead_id;
    const fullName = [leadData.first_name, leadData.last_name].filter(Boolean).join(' ').trim();
    setForm((prev) => ({
      ...prev,
      toEmails: leadData.email && !prev.toEmails.includes(leadData.email)
        ? [...prev.toEmails, leadData.email]
        : prev.toEmails,
      recipientName: prev.recipientName || fullName,
      placeholders: {
        ...prev.placeholders,
        client_name: prev.placeholders.client_name || fullName || prev.placeholders.client_name,
        first_name: prev.placeholders.first_name || leadData.first_name || prev.placeholders.first_name,
      },
    }));
  }, [leadData]);

  const [sendEmail, { isLoading: sending }] = useSendAgentEmailMutation();

  // ── Actions ────────────────────────────────────────────────────────
  const validateBeforePreview = () => {
    if (form.toEmails.length === 0) { error('Add at least one recipient'); return false; }
    const bad = form.toEmails.find((e) => !isValidEmail(e));
    if (bad) { error(`Invalid recipient: ${bad}`); return false; }
    if (!form.subject.trim()) { error('Subject is required'); return false; }
    return true;
  };

  const goPreview = () => {
    if (!validateBeforePreview()) return;
    setView('preview');
  };

  const handleSend = async () => {
    const payload = {
      to_emails: form.toEmails,
      template_id: form.templateId || null,
      subject: fillText(form.subject, form.placeholders),
      body: fillText(form.body, form.placeholders),
      placeholders: form.placeholders,
      attachment_ids: form.attachIds,
      cc: form.cc,
      bcc: [],
      lead_id: form.leadId,
      recipient_name: form.recipientName || null,
    };

    try {
      const res = await sendEmail(payload).unwrap();
      setSentResult(res);
      setView('sent');
    } catch (e) {
      const detail = e?.data?.detail || e?.error || 'Failed to send email';
      error(detail);
      // Stay on Preview so the agent can fix and retry.
    }
  };

  const toggleAttachment = (id) => {
    setForm((prev) => ({
      ...prev,
      attachIds: prev.attachIds.includes(id)
        ? prev.attachIds.filter((x) => x !== id)
        : [...prev.attachIds, id],
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setSentResult(null);
    setView('compose');
  };

  // Prefer fetched lead data; fall back to a synthesized record built from
  // the caller's prefill (so the lead-info bar still renders when we skip
  // the network fetch).
  const displayLeadInfo = useMemo(() => {
    if (leadData) return leadData;
    if (!form.leadId) return null;
    if (!prefill?.toEmails?.length && !form.recipientName) return null;
    return {
      lead_id: form.leadId,
      email: form.toEmails[0] ?? '',
      phone_number: prefill?.phone ?? '',
      first_name: '',
      last_name: '',
    };
  }, [leadData, form.leadId, form.toEmails, form.recipientName, prefill]);

  // ── Header ─────────────────────────────────────────────────────────
  const tabs = useMemo(() => ([
    { key: 'compose', label: 'Compose', icon: Mail, active: ['compose', 'preview', 'sent'].includes(view) },
    { key: 'history', label: 'History', icon: History, active: view === 'history' },
  ]), [view]);

  const showSidebar = view === 'compose';

  return (
    <div className="rounded-2xl border border-white/10 bg-card/60 overflow-hidden transition-smooth">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-card/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setView(tab.key === 'history' ? 'history' : 'compose')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition
                  ${tab.active
                    ? 'border-primary/40 bg-primary/15 text-primary shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.4)]'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-lg border border-white/10 bg-white/5
              hover:bg-white/10 text-muted-foreground hover:text-foreground transition active:scale-90"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className={`p-4 md:p-5 ${showSidebar ? 'grid grid-cols-1 lg:grid-cols-[1fr,260px] gap-4' : ''}`}>
        <div key={view} className="animate-fade-in min-w-0">
          {view === 'compose' && (
            <ComposeView
              form={form}
              setForm={setForm}
              templates={templates}
              templatesLoading={templatesLoading || leadLoading}
              templatesError={templatesError}
              attachments={attachments}
              officeEmail={officeEmail}
              leadInfo={displayLeadInfo}
              onSubmit={goPreview}
              onCancel={onClose}
            />
          )}
          {view === 'preview' && (
            <PreviewView
              form={form}
              attachments={attachments}
              officeEmail={officeEmail}
              onBack={() => setView('compose')}
              onSend={handleSend}
              sending={sending}
            />
          )}
          {view === 'sent' && (
            <SentView
              result={sentResult}
              onComposeAnother={resetForm}
              onViewHistory={() => setView('history')}
            />
          )}
          {view === 'history' && <HistoryView />}
        </div>

        {showSidebar && (
          <AttachmentSidebar
            attachments={attachments}
            selectedIds={form.attachIds}
            onToggle={toggleAttachment}
            isLoading={attachmentsLoading}
          />
        )}
      </div>
    </div>
  );
}
