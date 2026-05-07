import { X, Trash2 } from "lucide-react";

export default function ConfirmDeletePopup({
  open,
  title = "Delete Lead",
  message,
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-xl bg-slate-900 border border-slate-700 shadow-xl p-5 animate-pop-in">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-200 transition-smooth active:scale-90">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-slate-400 mb-5">
          {message || "Are you sure you want to delete this? This action cannot be undone."}
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-sm text-white disabled:opacity-50 transition-smooth active:scale-[0.97]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-sm text-white flex items-center gap-2 disabled:opacity-50 transition-smooth active:scale-[0.97]"
          >
            <Trash2 size={14} />
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
