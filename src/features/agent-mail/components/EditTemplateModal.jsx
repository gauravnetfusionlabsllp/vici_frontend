import { useState } from 'react';
import { Loader2, History, Save, X, Check, Minus } from 'lucide-react';
import Modal from '@/features/email-templates/components/Modal';
import {
  useUpdateAgentEmailTemplateMutation,
  useGetAgentEmailTemplateEditLogQuery,
} from '@/services';
import { useToast } from '@/shared/hooks/useToast';
import { fmtDate } from '../utils/format';

export default function EditTemplateModal({ template, attachments, onClose, onSaved }) {
  const [subject, setSubject] = useState(template?.subject ?? '');
  const [body, setBody] = useState(template?.body ?? '');
  const [attachIds, setAttachIds] = useState(template?.attachments?.map((a) => a.id) ?? []);
  const [showLog, setShowLog] = useState(false);

  const { success, error } = useToast();
  const [updateTpl, { isLoading: isSaving }] = useUpdateAgentEmailTemplateMutation();

  const isOpen = !!template;
  const dirty =
    subject !== (template?.subject ?? '') ||
    body !== (template?.body ?? '') ||
    JSON.stringify([...attachIds].sort()) !==
      JSON.stringify((template?.attachments ?? []).map((a) => a.id).sort());

  const toggleAttach = (id) => {
    setAttachIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    if (!dirty || !template) return;
    try {
      const res = await updateTpl({
        id: template.id,
        subject: subject.trim(),
        body: body.trim(),
        attachment_ids: attachIds,
      }).unwrap();
      const changes = [];
      if (res?.subject_changed) changes.push('subject');
      if (res?.body_changed) changes.push('body');
      if (res?.attachments_changed) changes.push('attachments');
      success(changes.length ? `Saved — ${changes.join(', ')} changed` : 'Template saved');
      onSaved?.(res?.data ?? null);
      onClose?.();
    } catch (e) {
      error(e?.data?.detail || 'Failed to save template');
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={`Edit: ${template?.name ?? ''}`} wide>
      {template && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              You can edit the <span className="text-foreground">subject</span>,{' '}
              <span className="text-foreground">body</span>, and{' '}
              <span className="text-foreground">linked attachments</span>. The template name is locked.
            </p>
            <button
              type="button"
              onClick={() => setShowLog((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <History className="w-3.5 h-3.5" />
              {showLog ? 'Hide edit history' : 'View edit history'}
            </button>
          </div>

          {showLog && <EditLogPanel templateId={template.id} />}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-foreground
                focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-foreground
                leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Linked attachments
            </label>
            <div className="rounded-lg border border-white/10 bg-slate-950/30 p-2 max-h-44 overflow-y-auto scrollbar-thin space-y-1">
              {attachments.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 px-2 italic">No attachments available.</p>
              ) : attachments.map((a) => {
                const isSel = attachIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAttach(a.id)}
                    className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition
                      ${isSel ? 'bg-primary/10 border border-primary/30' : 'border border-transparent hover:bg-white/5'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded border shrink-0 grid place-items-center
                      ${isSel ? 'bg-primary border-primary' : 'border-white/20'}`}>
                      {isSel && <Check className="w-2 h-2 text-primary-foreground" />}
                    </div>
                    <span className="text-foreground truncate">{a.original_name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-foreground hover:bg-white/10 text-sm transition"
            >
              <span className="inline-flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg border border-primary/40 bg-primary/20 text-primary
                font-semibold text-sm hover:bg-primary/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save changes
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function EditLogPanel({ templateId }) {
  const { data: log = [], isLoading, isError } =
    useGetAgentEmailTemplateEditLogQuery({ id: templateId, limit: 25 });

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/40 max-h-56 overflow-y-auto scrollbar-thin animate-fade-in-down">
      {isLoading ? (
        <div className="px-3 py-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading history…
        </div>
      ) : isError ? (
        <p className="px-3 py-4 text-xs text-destructive">Could not load history.</p>
      ) : log.length === 0 ? (
        <p className="px-3 py-4 text-xs text-muted-foreground italic">No previous edits.</p>
      ) : (
        <table className="w-full text-xs">
          <thead className="bg-slate-900/60 text-muted-foreground sticky top-0">
            <tr>
              <th className="text-left font-semibold uppercase tracking-widest px-3 py-2">Editor</th>
              <th className="text-left font-semibold uppercase tracking-widest px-3 py-2">When</th>
              <th className="text-center font-semibold uppercase tracking-widest px-2 py-2">Subj</th>
              <th className="text-center font-semibold uppercase tracking-widest px-2 py-2">Body</th>
              <th className="text-center font-semibold uppercase tracking-widest px-2 py-2">Att</th>
            </tr>
          </thead>
          <tbody>
            {log.map((r) => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="px-3 py-2 text-foreground">{r.edited_by}</td>
                <td className="px-3 py-2 text-muted-foreground">{fmtDate(r.edited_at)}</td>
                <td className="px-2 py-2 text-center"><Flag on={r.subject_changed} /></td>
                <td className="px-2 py-2 text-center"><Flag on={r.body_changed} /></td>
                <td className="px-2 py-2 text-center"><Flag on={r.attachments_changed} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Flag({ on }) {
  return on
    ? <Check className="inline w-3.5 h-3.5 text-emerald-400" />
    : <Minus className="inline w-3.5 h-3.5 text-muted-foreground/60" />;
}
