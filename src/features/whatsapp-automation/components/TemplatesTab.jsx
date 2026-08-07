import { useState, useCallback } from 'react';
import { Plus, RefreshCw, MessageSquare, Loader2, Send } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import ConfirmDeletePopup from '@/shared/components/ConfirmDeletePopup';
import { SkeletonCard } from '@/shared/components/ui';
import {
  useGetWaTemplatesQuery,
  useGetWaMetaOptionsQuery,
  useCreateWaTemplateMutation,
  useUpdateWaTemplateMutation,
  useDeleteWaTemplateMutation,
  useTestWaTemplateMutation,
} from '@/services';
import { Modal, Field, inputClass } from './ui';
import TemplateForm from './TemplateForm';
import TemplateCard from './TemplateCard';
import { apiError } from '../utils';

export default function TemplatesTab() {
  const { success, error } = useToast();
  const { data, isLoading, isFetching, refetch } = useGetWaTemplatesQuery();
  const { data: options } = useGetWaMetaOptionsQuery();

  const templates = data?.templates ?? [];
  const placeholders = data?.placeholders ?? [];

  const [createTemplate, { isLoading: isCreating }] = useCreateWaTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateWaTemplateMutation();
  const [deleteTemplate] = useDeleteWaTemplateMutation();
  const [testTemplate, { isLoading: isTesting }] = useTestWaTemplateMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [testTarget, setTestTarget] = useState(null);
  const [testPhone, setTestPhone] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = useCallback(async (payload) => {
    try {
      await createTemplate(payload).unwrap();
      success('Template created');
      setCreateOpen(false);
    } catch (e) { error(apiError(e, 'Failed to create template')); }
  }, [createTemplate, success, error]);

  const handleUpdate = useCallback(async (payload) => {
    try {
      await updateTemplate({ id: editTarget.id, ...payload }).unwrap();
      success('Template updated');
      setEditTarget(null);
    } catch (e) { error(apiError(e, 'Failed to update template')); }
  }, [updateTemplate, editTarget, success, error]);

  const handleDelete = useCallback(async () => {
    try {
      setIsDeleting(true);
      await deleteTemplate(deleteTarget.id).unwrap();
      success('Template deleted');
      setDeleteTarget(null);
    } catch (e) {
      error(apiError(e, 'Failed to delete template'));
    } finally { setIsDeleting(false); }
  }, [deleteTemplate, deleteTarget, success, error]);

  const handleTest = useCallback(async () => {
    try {
      const res = await testTemplate({ id: testTarget.id, to: testPhone }).unwrap();
      success(`Test message sent to ${testPhone}`);
      setTestTarget(null);
      setTestPhone('');
      return res;
    } catch (e) { error(apiError(e, 'Test send failed')); }
  }, [testTemplate, testTarget, testPhone, success, error]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
            {templates.length > 0 && (
              <span className="text-slate-600"> · evaluated by priority, first match sends</span>
            )}
          </span>
          <button onClick={refetch} disabled={isFetching} title="Refresh"
            className="h-7 w-7 grid place-items-center rounded-lg border border-white/10 bg-white/5
              text-slate-500 hover:text-slate-300 hover:bg-white/8 transition">
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-sky-600/40 bg-sky-600/20 px-3 py-1.5
            text-xs font-semibold text-sky-200 hover:bg-sky-600/30 transition">
          <Plus className="w-3.5 h-3.5" /> New Template
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} rows={3} withFooter />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="h-14 w-14 rounded-xl bg-slate-800/60 border border-white/10 grid place-items-center animate-pop-in">
            <MessageSquare className="w-6 h-6 text-slate-600" />
          </div>
          <div className="text-center max-w-sm">
            <p className="text-sm font-medium text-slate-400">No templates yet</p>
            <p className="text-xs text-slate-600 mt-1">
              Create one and every new Meta lead matching its schedule and filters gets an
              instant WhatsApp message.
            </p>
          </div>
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-sky-600/40 bg-sky-600/20 px-4 py-2
              text-sm font-semibold text-sky-200 hover:bg-sky-600/30 transition-smooth active:scale-[0.97]">
            <Plus className="w-4 h-4" /> Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
          {templates.map((tpl) => (
            <TemplateCard key={tpl.id} tpl={tpl}
              onEdit={setEditTarget} onDelete={setDeleteTarget}
              onTest={(t) => { setTestTarget(t); setTestPhone(''); }} />
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New WhatsApp Template" wide>
        <TemplateForm options={options} placeholders={placeholders}
          onSave={handleCreate} onCancel={() => setCreateOpen(false)} isSaving={isCreating} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Template" wide>
        {editTarget && (
          <TemplateForm initial={editTarget} options={options} placeholders={placeholders}
            onSave={handleUpdate} onCancel={() => setEditTarget(null)} isSaving={isUpdating} />
        )}
      </Modal>

      <Modal open={!!testTarget} onClose={() => setTestTarget(null)} title="Send a test message">
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Sends “{testTarget?.name}” to one number right now, ignoring its schedule and
            filters. Placeholders are filled with sample values. Logged as a manual send.
          </p>
          <Field label="Phone number" required hint="Include the country code, e.g. 918452015261.">
            <input className={inputClass} value={testPhone} inputMode="numeric"
              onChange={(e) => setTestPhone(e.target.value)} placeholder="918452015261" />
          </Field>
          <div className="flex justify-end gap-2">
            <button onClick={() => setTestTarget(null)}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300
                hover:bg-white/10 transition">Cancel</button>
            <button onClick={handleTest} disabled={isTesting || !testPhone.replace(/\D/g, '')}
              className="flex items-center gap-2 rounded-lg border border-emerald-600/40 bg-emerald-600/25
                px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-600/35
                disabled:opacity-50 transition">
              {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send test
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDeletePopup
        open={!!deleteTarget}
        title="Delete Template"
        message={`Delete "${deleteTarget?.name}"? Leads will stop receiving this message.`}
        loading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
