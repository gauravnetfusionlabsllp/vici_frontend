import { useState } from 'react';
import { Paperclip, X, Loader2 } from 'lucide-react';
import Field from './Field';
import AttachmentPicker from './AttachmentPicker';
import { inputCls } from '../utils';

export default function TemplateForm({ initial, onSave, onCancel, isSaving }) {
  const [name,      setName]      = useState(initial?.name    ?? '');
  const [subject,   setSubject]   = useState(initial?.subject ?? '');
  const [body,      setBody]      = useState(initial?.body    ?? '');
  const [attachIds, setAttachIds] = useState(
    initial?.attachments?.map((a) => a.id) ?? initial?.attachment_ids ?? []
  );

  const isValid = name.trim() && subject.trim() && body.trim();

  const handleSave = () => {
    if (!isValid) return;
    onSave({ name: name.trim(), subject: subject.trim(), body: body.trim(), attachment_ids: attachIds });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Template Name" required>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Welcome Email" />
        </Field>
        <Field label="Subject" required>
          <input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line" />
        </Field>
      </div>

      <Field label="Body" required>
        <textarea
          className={`${inputCls} resize-none`}
          rows={7}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your email body here…"
        />
      </Field>

      <Field label="Link Attachments">
        <div className="rounded-xl border border-white/8 bg-slate-950/20 p-3">
          <AttachmentPicker selectedIds={attachIds} onChange={setAttachIds} />
        </div>
        {attachIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {attachIds.map((id) => (
              <span key={id} className="inline-flex items-center gap-1.5 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs text-sky-300">
                <Paperclip className="w-3 h-3" />
                ID {id}
                <button type="button" onClick={() => setAttachIds((p) => p.filter((x) => x !== id))}>
                  <X className="w-3 h-3 hover:text-rose-400 transition" />
                </button>
              </span>
            ))}
          </div>
        )}
      </Field>

      <div className="flex justify-end gap-3 pt-3 border-t border-white/8">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 text-sm transition">
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isValid || isSaving}
          className="flex items-center gap-2 px-5 py-2 rounded-lg border border-sky-600/40 bg-sky-600/20 text-sky-100
            font-semibold text-sm hover:bg-sky-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          {initial ? 'Save Changes' : 'Create Template'}
        </button>
      </div>
    </div>
  );
}
