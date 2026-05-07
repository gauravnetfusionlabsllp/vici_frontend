import { useState, useCallback, useRef } from 'react';
import { Paperclip, Upload, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import {
  useGetEmailAttachmentsQuery,
  useUploadEmailAttachmentMutation,
  useDeleteEmailAttachmentMutation,
} from '@/services';
import ConfirmDeletePopup from '@/shared/components/ConfirmDeletePopup';
import { getFileIcon } from '../utils';
import { SkeletonAvatarRow } from '@/shared/components/ui';

export default function AttachmentsTab() {
  const { success, error } = useToast();
  const fileInputRef = useRef(null);
  const { data: attachments = [], isLoading, isFetching, refetch } = useGetEmailAttachmentsQuery();
  const [uploadAttachment, { isLoading: isUploading }] = useUploadEmailAttachmentMutation();
  const [deleteAttachment] = useDeleteEmailAttachmentMutation();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting,   setIsDeleting]   = useState(false);

  const handleUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      await uploadAttachment(fd).unwrap();
      success(`"${file.name}" uploaded successfully`);
    } catch {
      error('Upload failed. Please try again.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [uploadAttachment, success, error]);

  const handleDelete = useCallback(async () => {
    try {
      setIsDeleting(true);
      await deleteAttachment(deleteTarget.id).unwrap();
      success('Attachment deleted');
      setDeleteTarget(null);
    } catch {
      error('Failed to delete attachment');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteAttachment, deleteTarget, success, error]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">{attachments.length} file{attachments.length !== 1 ? 's' : ''}</span>
          <button onClick={refetch} disabled={isFetching}
            className="h-7 w-7 grid place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-500
              hover:text-slate-300 hover:bg-white/8 transition" title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-emerald-600/40
          bg-emerald-600/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-600/30 transition">
          {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {isUploading ? 'Uploading…' : 'Upload File'}
          <input ref={fileInputRef} type="file" hidden onChange={handleUpload} disabled={isUploading} />
        </label>
      </div>

      {isLoading ? (
        <SkeletonAvatarRow count={5} />
      ) : attachments.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="h-14 w-14 rounded-xl bg-slate-800/60 border border-white/10 grid place-items-center animate-pop-in">
            <Paperclip className="w-6 h-6 text-slate-600 animate-pulse-slow" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-400">No files uploaded</p>
            <p className="text-xs text-slate-600 mt-1">Upload a file to use it as an email attachment</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/8
              bg-slate-950/30 hover:bg-white/[0.03] hover:border-white/[0.14] transition-smooth group">
              <div className="flex items-center gap-3 min-w-0">
                {getFileIcon(att)}
                <div className="min-w-0">
                  <p className="text-sm text-slate-200 font-medium truncate">{att.original_name}</p>
                  <p className="text-xs text-slate-600 mt-0.5">ID: {att.id}</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteTarget(att)}
                className="ml-4 shrink-0 h-8 w-8 grid place-items-center rounded-lg border border-white/10 bg-white/5
                  text-slate-500 hover:text-rose-300 hover:border-rose-500/30 hover:bg-rose-500/10 transition-smooth active:scale-90
                  opacity-0 group-hover:opacity-100"
                title="Delete file"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeletePopup
        open={!!deleteTarget}
        title="Delete Attachment"
        message={`Delete "${deleteTarget?.original_name}"? This will also unlink it from any templates.`}
        loading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
