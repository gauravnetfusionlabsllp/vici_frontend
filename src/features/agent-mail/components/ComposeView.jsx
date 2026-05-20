import { useEffect, useMemo, useState } from 'react';
import { Lock, Plus, Pencil, Mail, Send, ArrowRight, Paperclip } from 'lucide-react';
import ChipInput from './ChipInput';
import TemplateSelector from './TemplateSelector';
import PlaceholderEditor from './PlaceholderEditor';
import LeadInfoBar from './LeadInfoBar';
import EditTemplateModal from './EditTemplateModal';
import { extractPlaceholders } from '../utils/placeholders';

export default function ComposeView({
  form,
  setForm,
  templates,
  templatesLoading,
  templatesError,
  attachments,
  officeEmail,
  leadInfo,
  onSubmit,
  onCancel,
  onTemplateUpdated,
}) {
  const [showCc, setShowCc] = useState(form.cc.length > 0);
  const [editingTpl, setEditingTpl] = useState(null);

  // Re-scan placeholders whenever subject or body changes; preserve existing values.
  useEffect(() => {
    const tokens = extractPlaceholders(form.subject, form.body);
    setForm((prev) => {
      const next = {};
      let touched = false;
      for (const k of tokens) {
        next[k] = prev.placeholders[k] ?? '';
        if (prev.placeholders[k] === undefined) touched = true;
      }
      for (const k of Object.keys(prev.placeholders)) {
        if (!tokens.includes(k)) touched = true;
      }
      if (!touched) return prev;
      return { ...prev, placeholders: next };
    });
  }, [form.subject, form.body, setForm]);

  const tokens = useMemo(
    () => extractPlaceholders(form.subject, form.body),
    [form.subject, form.body]
  );

  const selectedTpl = useMemo(
    () => templates.find((t) => t.id === form.templateId) || null,
    [templates, form.templateId]
  );

  const handleSelectTemplate = (t) => {
    const tplAttachIds = (t.attachments ?? []).map((a) => a.id);
    setForm((prev) => ({
      ...prev,
      templateId: t.id,
      tplName: t.name,
      subject: t.subject ?? '',
      body: t.body ?? '',
      attachIds: Array.from(new Set([...prev.attachIds, ...tplAttachIds])),
    }));
  };

  const handleClearTemplate = () => {
    setForm((prev) => ({
      ...prev,
      templateId: '',
      tplName: '',
      subject: '',
      body: '',
    }));
  };

  return (
    <div className="space-y-4">
      {/* Lead info */}
      {form.leadId && leadInfo && (
        <LeadInfoBar
          leadId={form.leadId}
          name={form.recipientName}
          email={leadInfo.email}
          phone={leadInfo.phone_number}
          onRemove={() => setForm((prev) => ({ ...prev, leadId: null, recipientName: '' }))}
        />
      )}

      {/* From */}
      <div className="grid grid-cols-1 sm:grid-cols-[80px,1fr] items-center gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">From</label>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/30 px-3 py-2">
          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm text-foreground">{officeEmail}</span>
          <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">Read-only</span>
        </div>
      </div>

      {/* To */}
      <div className="grid grid-cols-1 sm:grid-cols-[80px,1fr] items-start gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:pt-2">To</label>
        <div className="space-y-1">
          <ChipInput
            values={form.toEmails}
            onChange={(v) => setForm((prev) => ({ ...prev, toEmails: v }))}
            ariaLabel="Recipient emails"
          />
          {!showCc && (
            <button
              type="button"
              onClick={() => setShowCc(true)}
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Cc
            </button>
          )}
        </div>
      </div>

      {/* Cc */}
      {showCc && (
        <div className="grid grid-cols-1 sm:grid-cols-[80px,1fr] items-start gap-2 animate-fade-in">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:pt-2">Cc</label>
          <ChipInput
            values={form.cc}
            onChange={(v) => setForm((prev) => ({ ...prev, cc: v }))}
            ariaLabel="Cc emails"
          />
        </div>
      )}

      {/* Template */}
      <div className="grid grid-cols-1 sm:grid-cols-[80px,1fr] items-start gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:pt-2">Template</label>
        <div className="space-y-1.5">
          <div className="flex items-stretch gap-2">
            <div className="flex-1">
              <TemplateSelector
                templates={templates}
                value={form.templateId}
                onSelect={handleSelectTemplate}
                onClear={handleClearTemplate}
                isLoading={templatesLoading}
                error={templatesError}
              />
            </div>
            {selectedTpl && (
              <button
                type="button"
                onClick={() => setEditingTpl(selectedTpl)}
                className="shrink-0 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5
                  px-3 text-xs font-semibold text-foreground hover:bg-white/10 transition"
                title="Edit this template"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subject */}
      <div className="grid grid-cols-1 sm:grid-cols-[80px,1fr] items-start gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:pt-2">Subject</label>
        <input
          value={form.subject}
          onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
          placeholder="Subject line — supports {{placeholders}}"
          className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-foreground
            placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 sm:grid-cols-[80px,1fr] items-start gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:pt-2">Body</label>
        <textarea
          value={form.body}
          onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
          rows={10}
          style={{ lineHeight: 1.8 }}
          placeholder="Write the email body here — use {{client_name}} or other placeholders to personalize."
          className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-foreground
            placeholder:text-muted-foreground/70 resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Placeholders */}
      {tokens.length > 0 && (
        <div className="sm:pl-[88px]">
          <PlaceholderEditor
            tokens={tokens}
            values={form.placeholders}
            onChange={(v) => setForm((prev) => ({ ...prev, placeholders: v }))}
          />
        </div>
      )}

      {/* Footer summary + actions */}
      <div className="sticky bottom-0 -mx-4 md:-mx-5 px-4 md:px-5 py-3 mt-4 border-t border-white/10
        bg-card/80 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            {form.toEmails.length} recipient{form.toEmails.length !== 1 ? 's' : ''}
            {form.cc.length > 0 && <span className="text-muted-foreground/80">+ {form.cc.length} cc</span>}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5" />
            {form.attachIds.length} attachment{form.attachIds.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-foreground hover:bg-white/10 text-sm transition"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={onSubmit}
            className="flex items-center gap-2 px-5 py-2 rounded-lg border border-primary/50 bg-primary text-primary-foreground
              font-semibold text-sm hover:bg-primary/90 transition active:scale-[0.97]"
          >
            <Send className="w-4 h-4" />
            Preview &amp; Send
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inline template edit modal */}
      <EditTemplateModal
        template={editingTpl}
        attachments={attachments}
        onClose={() => setEditingTpl(null)}
        onSaved={(updated) => {
          if (updated && updated.id === form.templateId) {
            setForm((prev) => ({
              ...prev,
              subject: updated.subject ?? prev.subject,
              body: updated.body ?? prev.body,
            }));
          }
          onTemplateUpdated?.();
        }}
      />
    </div>
  );
}
