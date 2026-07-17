import { useEffect, useMemo, useState } from 'react';
import { X, Plus, Trash2, Loader2, Columns3, Save } from 'lucide-react';

import { useSaveHotMetaLeadNotesMappingMutation } from '@/services';
import { useToast } from '@/shared/hooks/useToast';

// The column types an admin can define. `select`/`multiselect` carry an options list.
const CUSTOM_FIELD_TYPES = [
  { value: 'text', label: 'Text', hasOptions: false },
  { value: 'select', label: 'Single-select', hasOptions: true },
  { value: 'multiselect', label: 'Multiselect', hasOptions: true },
];

const TYPE_LABEL = CUSTOM_FIELD_TYPES.reduce((acc, t) => {
  acc[t.value] = t.label;
  return acc;
}, {});

const typeHasOptions = (type) => CUSTOM_FIELD_TYPES.find((t) => t.value === type)?.hasOptions ?? false;

const inputCls =
  'w-full rounded-md border border-input bg-input/40 px-3 py-2 text-sm text-foreground ' +
  'placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-smooth';

const labelCls = 'text-[11px] font-semibold uppercase tracking-widest text-muted-foreground';

// Small removable chips list used for both the options editor and the read-only option display.
function Chips({ items, onRemove }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <span
          key={it}
          className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-primary/15 border border-primary/30 text-primary text-[11px]"
        >
          {it}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(it)}
              className="h-4 w-4 grid place-items-center rounded hover:bg-primary/30 text-primary/80 hover:text-primary transition-smooth"
              title="Remove option"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

// Free-text tag input: add an option on Enter or the + button, remove via chip.
function OptionsEditor({ options, onChange }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (options.some((o) => o.toLowerCase() === v.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...options, v]);
    setDraft('');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Type an option and press Enter…"
          className={inputCls}
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="shrink-0 inline-flex items-center gap-1 px-3 rounded-md border border-primary/40 bg-primary/15 text-primary text-sm font-medium hover:bg-primary/25 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
      <Chips items={options} onRemove={(o) => onChange(options.filter((x) => x !== o))} />
    </div>
  );
}

export default function ManageCustomColumnsModal({ onClose, formFields = [] }) {
  const { success, error: toastError } = useToast();
  const [saveMapping, { isLoading: isSaving }] = useSaveHotMetaLeadNotesMappingMutation();

  // Staged new columns to append on save.
  const [newColumns, setNewColumns] = useState([]);
  // The column currently being defined.
  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  const [options, setOptions] = useState([]);

  const resetDraft = () => {
    setName('');
    setType('text');
    setOptions([]);
  };

  // Close on Escape. (Mounted only while open, so local state starts fresh on each open.)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // All names already taken (existing definitions + staged additions), lowercased.
  const takenNames = useMemo(
    () =>
      new Set([
        ...formFields.map((f) => (f.name ?? '').trim().toLowerCase()),
        ...newColumns.map((f) => f.name.toLowerCase()),
      ]),
    [formFields, newColumns],
  );

  const trimmedName = name.trim();
  const needsOptions = typeHasOptions(type);
  const nameTaken = trimmedName && takenNames.has(trimmedName.toLowerCase());
  const canAddColumn =
    !!trimmedName && !nameTaken && (!needsOptions || options.length > 0);

  const addColumn = () => {
    if (!canAddColumn) return;
    const col = { name: trimmedName, type };
    if (needsOptions) col.options = options;
    setNewColumns((prev) => [...prev, col]);
    resetDraft();
  };

  const removeStaged = (idx) => setNewColumns((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (newColumns.length === 0) return;
    try {
      await saveMapping([...formFields, ...newColumns]).unwrap();
      success(`Added ${newColumns.length} custom column${newColumns.length > 1 ? 's' : ''}`);
      onClose();
    } catch (e) {
      toastError(`Failed to save columns: ${e?.data?.detail || e?.error || e?.message || 'unknown error'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-[0_30px_120px_rgba(0,0,0,0.6)] overflow-y-auto max-h-[90vh] animate-pop-in">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-card/95 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg border border-primary/30 bg-primary/10 grid place-items-center shrink-0">
              <Columns3 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground leading-none">Custom Columns</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Add columns shown for every hot lead</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-lg border border-border bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-foreground transition-smooth active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Existing columns (read-only) */}
          <section className="space-y-2">
            <div className={labelCls}>Existing columns</div>
            {formFields.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No custom columns defined yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {formFields.map((f) => (
                  <li
                    key={f.name}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/20 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <span className="text-sm text-foreground font-medium">{f.name}</span>
                      {f.options?.length > 0 && (
                        <div className="mt-1">
                          <Chips items={f.options} />
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] uppercase tracking-widest text-muted-foreground rounded border border-border px-1.5 py-0.5">
                      {TYPE_LABEL[f.type] ?? f.type}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Staged new columns */}
          {newColumns.length > 0 && (
            <section className="space-y-2">
              <div className={labelCls}>To be added</div>
              <ul className="space-y-1.5">
                {newColumns.map((f, idx) => (
                  <li
                    key={`${f.name}-${idx}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/10 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <span className="text-sm text-foreground font-medium">{f.name}</span>
                      {f.options?.length > 0 && (
                        <div className="mt-1">
                          <Chips items={f.options} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground rounded border border-border px-1.5 py-0.5">
                        {TYPE_LABEL[f.type] ?? f.type}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeStaged(idx)}
                        className="h-6 w-6 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Add-column form */}
          <section className="space-y-3 rounded-lg border border-border bg-secondary/10 p-4">
            <div className={labelCls}>New column</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. status"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Type</label>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setOptions([]);
                  }}
                  className={inputCls}
                >
                  {CUSTOM_FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {needsOptions && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Options</label>
                <OptionsEditor options={options} onChange={setOptions} />
              </div>
            )}

            {nameTaken && (
              <p className="text-[11px] text-destructive">A column named "{trimmedName}" already exists.</p>
            )}

            <button
              type="button"
              onClick={addColumn}
              disabled={!canAddColumn}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-primary/40 bg-primary/15 text-primary text-sm font-medium hover:bg-primary/25 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" /> Add column
            </button>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-3 px-6 py-4 border-t border-border bg-card/95 backdrop-blur">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary text-sm transition-smooth"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={newColumns.length === 0 || isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-primary/40 bg-primary/20 text-primary font-semibold text-sm hover:bg-primary/30 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save columns
          </button>
        </div>
      </div>
    </div>
  );
}
