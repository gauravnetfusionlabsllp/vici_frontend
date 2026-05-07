import { useState, useCallback } from 'react';
import { Mail, Plus, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import {
  useGetEmailTemplatesQuery,
  useCreateEmailTemplateMutation,
  useUpdateEmailTemplateMutation,
  useDeleteEmailTemplateMutation,
} from '@/services';
import ConfirmDeletePopup from '@/shared/components/ConfirmDeletePopup';
import Modal from './Modal';
import TemplateForm from './TemplateForm';
import TemplateCard from './TemplateCard';
import { getFileIcon } from '../utils';
import { SkeletonCard } from '@/shared/components/ui';

export default function TemplatesTab() {
  const { success, error } = useToast();
  const { data: templates = [], isLoading, isFetching, refetch } = useGetEmailTemplatesQuery();
  const [createTemplate, { isLoading: isCreating }] = useCreateEmailTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateEmailTemplateMutation();
  const [deleteTemplate] = useDeleteEmailTemplateMutation();

  const [createOpen,   setCreateOpen]   = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [viewTarget,   setViewTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting,   setIsDeleting]   = useState(false);

  const handleCreate = useCallback(async (payload) => {
    try {
      await createTemplate(payload).unwrap();
      success('Template created successfully');
      setCreateOpen(false);
    } catch { error('Failed to create template'); }
  }, [createTemplate, success, error]);

  const handleUpdate = useCallback(async (payload) => {
    try {
      await updateTemplate({ id: editTarget.id, ...payload }).unwrap();
      success('Template updated successfully');
      setEditTarget(null);
    } catch { error('Failed to update template'); }
  }, [updateTemplate, editTarget, success, error]);

  const handleDelete = useCallback(async () => {
    try {
      setIsDeleting(true);
      await deleteTemplate(deleteTarget.id).unwrap();
      success('Template deleted');
      setDeleteTarget(null);
    } catch {
      error('Failed to delete template');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTemplate, deleteTarget, success, error]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">{templates.length} template{templates.length !== 1 ? 's' : ''}</span>
          <button onClick={refetch} disabled={isFetching}
            className="h-7 w-7 grid place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-500
              hover:text-slate-300 hover:bg-white/8 transition" title="Refresh">
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
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} rows={2} withFooter />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="h-14 w-14 rounded-xl bg-slate-800/60 border border-white/10 grid place-items-center animate-pop-in">
            <Mail className="w-6 h-6 text-slate-600 animate-pulse-slow" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-400">No templates yet</p>
            <p className="text-xs text-slate-600 mt-1">Create your first email template to get started</p>
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
            <TemplateCard key={tpl.id} tpl={tpl} onEdit={setEditTarget} onDelete={setDeleteTarget} onView={setViewTarget} />
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Email Template" wide>
        <TemplateForm onSave={handleCreate} onCancel={() => setCreateOpen(false)} isSaving={isCreating} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Template" wide>
        {editTarget && (
          <TemplateForm initial={editTarget} onSave={handleUpdate} onCancel={() => setEditTarget(null)} isSaving={isUpdating} />
        )}
      </Modal>

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Template Preview" wide>
        {viewTarget && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/8 bg-slate-950/40 divide-y divide-white/6">
              {[{ label: 'Name', value: viewTarget.name }, { label: 'Subject', value: viewTarget.subject }].map(({ label, value }) => (
                <div key={label} className="flex items-start gap-4 px-4 py-3">
                  <span className="text-xs uppercase tracking-widest text-slate-500 w-16 shrink-0 mt-0.5">{label}</span>
                  <span className="text-sm text-slate-200">{value}</span>
                </div>
              ))}
              <div className="px-4 py-3">
                <span className="text-xs uppercase tracking-widest text-slate-500 block mb-2">Body</span>
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed
                  bg-slate-950/60 border border-white/8 rounded-lg p-3 max-h-56 overflow-y-auto scrollbar-thin">
                  {viewTarget.body}
                </pre>
              </div>
            </div>
            {viewTarget.attachments?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Attachments</p>
                <div className="flex flex-wrap gap-2">
                  {viewTarget.attachments.map((a) => (
                    <span key={a.id} className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-slate-800/60 px-2 py-1 text-xs text-slate-300">
                      {getFileIcon(a)}
                      {a.original_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDeletePopup
        open={!!deleteTarget}
        title="Delete Template"
        message={`Delete "${deleteTarget?.name}"? This action cannot be undone.`}
        loading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
