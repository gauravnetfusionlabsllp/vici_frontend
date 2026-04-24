import { useState, useCallback, useRef } from "react";
import {
  Mail,
  Paperclip,
  Plus,
  Trash2,
  Pencil,
  Upload,
  X,
  Eye,
  FileText,
  Image,
  File,
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useToast } from "../customHooks/useToast";
import ConfirmDeletePopup from "../components/ConfimDeletePopup";
import {
  useGetEmailTemplatesQuery,
  useGetEmailAttachmentsQuery,
  useCreateEmailTemplateMutation,
  useUpdateEmailTemplateMutation,
  useDeleteEmailTemplateMutation,
  useUploadEmailAttachmentMutation,
  useDeleteEmailAttachmentMutation,
} from "../services/dashboardApi";

// ─────────────────────────────────────────────
// SMALL UTILITIES
// ─────────────────────────────────────────────

function getFileIcon(att) {
  if (!att) return <File className="w-4 h-4 text-slate-400" />;
  const type = att.file_type ?? "";
  const name = att.original_name ?? "";
  const ext  = name.split(".").pop()?.toLowerCase();

  if (type.startsWith("image/") || ["jpg","jpeg","png","gif","webp","svg"].includes(ext))
    return <Image className="w-4 h-4 text-sky-400" />;
  if (type === "application/pdf" || ext === "pdf")
    return <FileText className="w-4 h-4 text-rose-400" />;
  if (type.includes("spreadsheet") || type.includes("excel") || ["xlsx","xls","csv"].includes(ext))
    return <FileText className="w-4 h-4 text-emerald-400" />;
  return <File className="w-4 h-4 text-slate-400" />;
}



// ─────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────
function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4">
      <div
        className={`w-full ${wide ? "max-w-3xl" : "max-w-md"} rounded-2xl border border-white/10
          bg-gradient-to-b from-slate-900/90 to-slate-950/95
          shadow-[0_30px_120px_rgba(0,0,0,0.65)] overflow-y-auto max-h-[90vh]`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60 backdrop-blur">
          <h3 className="text-base font-semibold text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-lg border border-white/10 bg-white/5
              hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FORM FIELD WRAPPER
// ─────────────────────────────────────────────
function Field({ label, children, required }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 " +
  "placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition";

// ─────────────────────────────────────────────
// ATTACHMENT PICKER  (used inside TemplateForm)
// ─────────────────────────────────────────────
function AttachmentPicker({ selectedIds, onChange }) {
  const { data: attachments = [], isLoading } = useGetEmailAttachmentsQuery();

  const toggle = (id) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  };

  if (isLoading) return (
    <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading attachments…
    </div>
  );

  if (!attachments.length) return (
    <p className="text-xs text-slate-500 py-3 italic">
      No attachments uploaded yet. Upload files in the Attachments tab first.
    </p>
  );

  return (
    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
      {attachments.map((att) => {
        const isSelected = selectedIds.includes(att.id);
        return (
          <button
            key={att.id}
            type="button"
            onClick={() => toggle(att.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition
              ${isSelected
                ? "border-sky-500/40 bg-sky-500/10"
                : "border-white/8 bg-slate-950/30 hover:bg-white/5"
              }`}
          >
            <div className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition
              ${isSelected ? "bg-sky-500 border-sky-400" : "border-white/20"}`}>
              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            {getFileIcon(att)}
            <span className="text-sm text-slate-300 truncate flex-1">{att.original_name}</span>
            <span className="text-xs text-slate-600 shrink-0">ID {att.id}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// TEMPLATE FORM  (create + edit)
// ─────────────────────────────────────────────
function TemplateForm({ initial, onSave, onCancel, isSaving }) {
  const [name,        setName]        = useState(initial?.name        ?? "");
  const [subject,     setSubject]     = useState(initial?.subject     ?? "");
  const [body,        setBody]        = useState(initial?.body        ?? "");
  const [attachIds,   setAttachIds]   = useState(
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
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Welcome Email"
          />
        </Field>
        <Field label="Subject" required>
          <input
            className={inputCls}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject line"
          />
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
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 text-sm transition"
        >
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
          {initial ? "Save Changes" : "Create Template"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TEMPLATE CARD
// ─────────────────────────────────────────────
function TemplateCard({ tpl, onEdit, onDelete, onView }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/8
      bg-gradient-to-b from-slate-900/60 to-slate-950/70
      hover:border-white/[0.14] transition-all duration-200
      shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
      {/* hover glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
        bg-[radial-gradient(400px_circle_at_0%_0%,rgba(56,189,248,0.06),transparent_60%)]" />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-xl border border-white/10 bg-slate-800/60 grid place-items-center">
              <Mail className="w-4 h-4 text-sky-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-100 truncate">{tpl.name}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{tpl.subject}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onView(tpl)}
              title="Preview"
              className="h-8 w-8 grid place-items-center rounded-lg border border-white/10 bg-white/5
                text-slate-400 hover:text-sky-300 hover:border-sky-500/30 hover:bg-sky-500/10 transition"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onEdit(tpl)}
              title="Edit"
              className="h-8 w-8 grid place-items-center rounded-lg border border-white/10 bg-white/5
                text-slate-400 hover:text-amber-300 hover:border-amber-500/30 hover:bg-amber-500/10 transition"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(tpl)}
              title="Delete"
              className="h-8 w-8 grid place-items-center rounded-lg border border-white/10 bg-white/5
                text-slate-400 hover:text-rose-300 hover:border-rose-500/30 hover:bg-rose-500/10 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Body preview */}
        <p className="mt-4 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {tpl.body || "No body content."}
        </p>

        {/* Attachment chips */}
        {tpl.attachments?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tpl.attachments.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/8 bg-slate-800/60 px-2 py-0.5 text-xs text-slate-400"
              >
                {getFileIcon(a)}
                <span className="max-w-[120px] truncate">{a.original_name}</span>
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-600 border-t border-white/6 pt-3">
          <span>ID: {tpl.id}</span>
          <span>{tpl.attachments?.length ?? 0} attachment{tpl.attachments?.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TEMPLATES TAB
// ─────────────────────────────────────────────
function TemplatesTab() {
  const { success, error } = useToast();

  const {
    data: templates = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetEmailTemplatesQuery();

  const [createTemplate, { isLoading: isCreating }] = useCreateEmailTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateEmailTemplateMutation();
  const [deleteTemplate] = useDeleteEmailTemplateMutation();

  const [createOpen,  setCreateOpen]  = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [viewTarget,  setViewTarget]  = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting,  setIsDeleting]  = useState(false);

  const handleCreate = useCallback(async (payload) => {
    try {
      await createTemplate(payload).unwrap();
      success("Template created successfully");
      setCreateOpen(false);
    } catch {
      error("Failed to create template");
    }
  }, [createTemplate, success, error]);

  const handleUpdate = useCallback(async (payload) => {
    try {
      await updateTemplate({ id: editTarget.id, ...payload }).unwrap();
      success("Template updated successfully");
      setEditTarget(null);
    } catch {
      error("Failed to update template");
    }
  }, [updateTemplate, editTarget, success, error]);

  const handleDelete = useCallback(async () => {
    try {
      setIsDeleting(true);
      await deleteTemplate(deleteTarget.id).unwrap();
      success("Template deleted");
      setDeleteTarget(null);
    } catch {
      error("Failed to delete template");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTemplate, deleteTarget, success, error]);

  return (
    <div className="space-y-4">
      {/* Sub-header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {templates.length} template{templates.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={refetch}
            disabled={isFetching}
            className="h-7 w-7 grid place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-500
              hover:text-slate-300 hover:bg-white/8 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-sky-600/40 bg-sky-600/20 px-3 py-1.5
            text-xs font-semibold text-sky-200 hover:bg-sky-600/30 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          New Template
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-sky-400" />
        </div>
      ) : templates.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-slate-800/60 border border-white/10 grid place-items-center">
            <Mail className="w-6 h-6 text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-400">No templates yet</p>
            <p className="text-xs text-slate-600 mt-1">Create your first email template to get started</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-sky-600/40 bg-sky-600/20 px-4 py-2
              text-sm font-semibold text-sky-200 hover:bg-sky-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              tpl={tpl}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
              onView={setViewTarget}
            />
          ))}
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Create */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Email Template" wide>
        <TemplateForm
          onSave={handleCreate}
          onCancel={() => setCreateOpen(false)}
          isSaving={isCreating}
        />
      </Modal>

      {/* Edit */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Template" wide>
        {editTarget && (
          <TemplateForm
            initial={editTarget}
            onSave={handleUpdate}
            onCancel={() => setEditTarget(null)}
            isSaving={isUpdating}
          />
        )}
      </Modal>

      {/* Preview */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Template Preview" wide>
        {viewTarget && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/8 bg-slate-950/40 divide-y divide-white/6">
              {[
                { label: "Name",    value: viewTarget.name },
                { label: "Subject", value: viewTarget.subject },
              ].map(({ label, value }) => (
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
                    <span
                      key={a.id}
                      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-slate-800/60 px-2 py-1 text-xs text-slate-300"
                    >
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

      {/* Delete confirm — reusing project's ConfirmDeletePopup */}
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

// ─────────────────────────────────────────────
// ATTACHMENTS TAB
// ─────────────────────────────────────────────
function AttachmentsTab() {
  const { success, error } = useToast();
  const fileInputRef = useRef(null);

  const {
    data: attachments = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetEmailAttachmentsQuery();

  const [uploadAttachment, { isLoading: isUploading }] = useUploadEmailAttachmentMutation();
  const [deleteAttachment] = useDeleteEmailAttachmentMutation();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting,  setIsDeleting]  = useState(false);

  const handleUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);

    try {
      await uploadAttachment(fd).unwrap();
      success(`"${file.name}" uploaded successfully`);
    } catch {
      error("Upload failed. Please try again.");
    } finally {
      // reset input so the same file can be re-uploaded if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [uploadAttachment, success, error]);

  const handleDelete = useCallback(async () => {
    try {
      setIsDeleting(true);
      await deleteAttachment(deleteTarget.id).unwrap();
      success("Attachment deleted");
      setDeleteTarget(null);
    } catch {
      error("Failed to delete attachment");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteAttachment, deleteTarget, success, error]);

  return (
    <div className="space-y-4">
      {/* Sub-header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {attachments.length} file{attachments.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={refetch}
            disabled={isFetching}
            className="h-7 w-7 grid place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-500
              hover:text-slate-300 hover:bg-white/8 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
        <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-emerald-600/40
          bg-emerald-600/20 px-3 py-1.5 text-xs font-semibold text-emerald-200
          hover:bg-emerald-600/30 transition">
          {isUploading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Upload className="w-3.5 h-3.5" />
          }
          {isUploading ? "Uploading…" : "Upload File"}
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {/* File list */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-sky-400" />
        </div>
      ) : attachments.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-slate-800/60 border border-white/10 grid place-items-center">
            <Paperclip className="w-6 h-6 text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-400">No files uploaded</p>
            <p className="text-xs text-slate-600 mt-1">Upload a file to use it as an email attachment</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/8
                bg-slate-950/30 hover:bg-white/[0.03] transition group"
            >
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
                  text-slate-500 hover:text-rose-300 hover:border-rose-500/30 hover:bg-rose-500/10 transition
                  opacity-0 group-hover:opacity-100"
                title="Delete file"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
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


// ─────────────────────────────────────────────
// PAGE ROOT
// ─────────────────────────────────────────────
const TABS = [
  { key: "templates",   label: "Templates",   icon: Mail },
  { key: "attachments", label: "Attachments", icon: Paperclip },
];

export default function EmailTemplatesPage() {
  const [tab, setTab] = useState("templates");

  return (
    <div className="min-h-screen p-4 md:p-6 bg-[hsl(231_58%_6%)] text-white">
      <div className="mx-auto max-w-[1440px] space-y-5">

        {/* ── Page header ── */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10
          bg-gradient-to-b from-slate-900/70 to-slate-950/80
          shadow-[0_30px_120px_rgba(0,0,0,0.55)] px-5 py-5">
          <div className="pointer-events-none absolute inset-0 opacity-60
            bg-[radial-gradient(700px_circle_at_0%_0%,rgba(56,189,248,0.14),transparent_55%),
               radial-gradient(600px_circle_at_100%_100%,rgba(168,85,247,0.10),transparent_55%)]" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl border border-sky-400/20 bg-sky-500/10 grid place-items-center shrink-0">
                <Mail className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-100 leading-none">Email Management</h1>
                <p className="text-xs text-slate-400 mt-1">Manage email templates and attachments</p>
              </div>
            </div>
            {/* <div className="flex items-center gap-2 flex-wrap">
              {["GET", "POST", "PUT", "DELETE"].map((m) => (
                <span key={m}>{getMethodBadge(m)}</span>
              ))}
              <span className="text-xs text-slate-500 hidden sm:inline">Admin-only · JWT required</span>
            </div> */}
          </div>
        </div>

        {/* ── Main card ── */}
        <div className="border border-border rounded-xl bg-card/60 p-4 md:p-5">
          {/* Tab bar */}
          <div className="flex gap-2 mb-5 border-b border-white/8 pb-4">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition
                  ${tab === key
                    ? "border-sky-500/40 bg-sky-500/15 text-sky-200"
                    : "border-white/8 bg-white/[0.03] text-slate-400 hover:text-slate-200 hover:bg-white/6"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === "templates"   && <TemplatesTab />}
          {tab === "attachments" && <AttachmentsTab />}
        </div>

      </div>
    </div>
  );
}
