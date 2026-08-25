import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { Loader2, Save, CheckCircle, ChevronDown, Check } from 'lucide-react';

import {
  useUpdateHotMetaLeadMutation,
  useUpdateHotMetaLeadCustomFieldsMutation,
} from '@/services';
import { useToast } from '@/shared/hooks/useToast';
import { selectMaskPii } from '@/features/auth/slices/authSlice';
import { maskEmail, maskPhone } from '@/shared/lib/mask';
import { gridTheme } from '@/features/manager-view/components/gridConfig';
import { CONTACT_OPTIONS } from '../constants';
import { ibLabel, shortDate } from '../utils';
import BoolBadge from './BoolBadge';
import RawDataCell from './RawDataCell';
import ExpandableTextCell from './ExpandableTextCell';
import RecordingCell from './RecordingCell';
import DispositionBadge from './DispositionBadge';

ModuleRegistry.registerModules([AllCommunityModule]);

const inputCls =
  'w-full rounded-md border border-input bg-input/40 px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-smooth';

// Normalize how_contacted to an array. Legacy rows may have a comma-separated string.
const toContactArray = (v) => {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (!v) return [];
  return String(v).split(',').map((s) => s.trim()).filter(Boolean);
};

function baseDraft(row) {
  return {
    how_contacted: toContactArray(row.how_contacted),
    response: row.response ?? '',
    client_registered: row.client_registered ?? null,
    client_deposited: row.client_deposited ?? null,
  };
}

const triBoolValue = (v) => (v === null || v === undefined ? '' : String(v));
const parseTriBool = (s) => (s === '' ? null : s === 'true');

// ────────── Cell renderers (defined at module scope so columnDefs stay stable) ──────────

function ContactCellRenderer(params) {
  const { canEdit, draftsRef, markDirty, theme } = params.context;
  const row = params.data;
  const editable = canEdit(row);

  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [selected, setSelected] = useState(() => toContactArray(row.how_contacted));

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (wrapRef.current && wrapRef.current.contains(e.target)) return;
      const popup = document.getElementById(`contact-popup-${row.lead_id}`);
      if (popup && popup.contains(e.target)) return;
      setOpen(false);
    };
    // Portal popup is fixed-positioned; close on any scroll/resize so it
    // never drifts away from the trigger.
    const close = () => setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open, row.lead_id]);

  if (!editable || selected.length > 0) {
    return <span className="text-xs text-muted-foreground">{selected.length ? selected.join(', ') : '—'}</span>;
  }

  const label = 'Select…';
  const openMenu = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom, left: r.left, width: r.width });
    setOpen(true);
  };

  const toggle = (value) => {
    const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
    draftsRef.current[row.lead_id] = {
      ...(draftsRef.current[row.lead_id] ?? baseDraft(row)),
      how_contacted: next,
    };
    markDirty(row.lead_id);
    setSelected(next);
    if (next.length > 0) setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative w-full h-full flex items-center">
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        title={label}
        className={`w-full flex items-center justify-between gap-1 rounded-md border border-input bg-input/40 px-2 py-1 text-xs text-left transition-smooth text-muted-foreground
          ${open ? 'border-primary/60' : 'hover:border-primary/40'}`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={`w-3 h-3 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && pos && createPortal(
        <div
          id={`contact-popup-${row.lead_id}`}
          data-theme={theme}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 1000 }}
          className="rv-scope rounded-md border border-border bg-card shadow-lg overflow-hidden"
        >
          {CONTACT_OPTIONS.filter(Boolean).map((opt) => {
            const active = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left transition-smooth
                  ${active ? 'bg-primary/15 text-foreground' : 'text-foreground/80 hover:bg-secondary/40'}`}
              >
                <span className={`h-3.5 w-3.5 rounded border grid place-items-center shrink-0 transition-smooth
                  ${active ? 'bg-primary/30 border-primary/60' : 'border-border'}`}>
                  {active && <Check className="w-2.5 h-2.5 text-primary" />}
                </span>
                <span className="truncate">{opt}</span>
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}

function ResponseCellRenderer(params) {
  const { canEdit, draftsRef, markDirty } = params.context;
  const row = params.data;
  if (!canEdit(row)) {
    return <span className="text-xs text-muted-foreground">{row.response || '—'}</span>;
  }
  return (
    <input
      type="text"
      ref={(el) => {
        if (!el) return;
        const draft = draftsRef.current[row.lead_id];
        el.value = draft?.response ?? row.response ?? '';
      }}
      placeholder="Enter response…"
      onChange={(e) => {
        draftsRef.current[row.lead_id] = {
          ...(draftsRef.current[row.lead_id] ?? baseDraft(row)),
          response: e.target.value,
        };
        markDirty(row.lead_id);
      }}
      className={inputCls}
    />
  );
}

function RegisteredCellRenderer(params) {
  const { canEdit, draftsRef, markDirty } = params.context;
  const row = params.data;
  if (!canEdit(row)) return <BoolBadge value={row.client_registered} />;
  return (
    <select
      ref={(el) => {
        if (!el) return;
        const draft = draftsRef.current[row.lead_id];
        const v = draft ? draft.client_registered : row.client_registered ?? null;
        el.value = triBoolValue(v);
      }}
      onChange={(e) => {
        draftsRef.current[row.lead_id] = {
          ...(draftsRef.current[row.lead_id] ?? baseDraft(row)),
          client_registered: parseTriBool(e.target.value),
        };
        markDirty(row.lead_id);
      }}
      className={inputCls}
    >
      <option value="">Unknown</option>
      <option value="true">Yes</option>
      <option value="false">No</option>
    </select>
  );
}

function DepositedCellRenderer(params) {
  const { canEdit, draftsRef, markDirty } = params.context;
  const row = params.data;
  if (!canEdit(row)) return <BoolBadge value={row.client_deposited} />;
  return (
    <select
      ref={(el) => {
        if (!el) return;
        const draft = draftsRef.current[row.lead_id];
        const v = draft ? draft.client_deposited : row.client_deposited ?? null;
        el.value = triBoolValue(v);
      }}
      onChange={(e) => {
        draftsRef.current[row.lead_id] = {
          ...(draftsRef.current[row.lead_id] ?? baseDraft(row)),
          client_deposited: parseTriBool(e.target.value),
        };
        markDirty(row.lead_id);
      }}
      className={inputCls}
    >
      <option value="">Unknown</option>
      <option value="true">Yes</option>
      <option value="false">No</option>
    </select>
  );
}

function ActionCellRenderer(params) {
  const { canEdit, dirtySet, savingId, savedSet, onSave } = params.context;
  const row = params.data;
  if (!canEdit(row)) return null;

  const isDirty = dirtySet.has(row.lead_id);
  const isSaving = savingId === row.lead_id;
  const isSaved = !isDirty && savedSet.has(row.lead_id);
  const disabled = isSaving || (!isDirty && !isSaved);

  // Active (dirty) → primary; everything else (clean / saved / saving) → muted grey.
  const toneCls = isDirty
    ? 'border-primary/40 bg-primary/15 text-primary hover:bg-primary/25'
    : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary/40';

  return (
    <button
      onClick={() => onSave(row)}
      disabled={disabled}
      title={isDirty ? 'Save changes' : isSaved ? 'Saved' : 'No changes to save'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md
        border transition-smooth active:scale-[0.97]
        disabled:cursor-not-allowed ${toneCls}`}
    >
      {isSaving ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : isSaved ? (
        <CheckCircle className="w-3 h-3 text-[hsl(var(--status-active))]" />
      ) : (
        <Save className="w-3 h-3" />
      )}
      {isSaving ? 'Saving…' : isSaved ? 'Saved' : 'Save'}
    </button>
  );
}

function ViciLeadStatusCellRenderer(params) {
  return <DispositionBadge value={params.value} />;
}

function RawDataCellRenderer(params) {
  return <RawDataCell data={params.value} theme={params.context.theme} />;
}

// IB = the lead sits in VICIdial's IB list (7022026); the server sends `is_ib` on the row.
function IbCellRenderer(params) {
  const v = params.value === 'Yes' ? true : params.value === 'No' ? false : null;
  return <BoolBadge value={v} />;
}

function SummaryCellRenderer(params) {
  return <ExpandableTextCell text={params.value} title="Call summary" theme={params.context.theme} />;
}

function TranscriptCellRenderer(params) {
  return <ExpandableTextCell text={params.value} title="Transcript" theme={params.context.theme} />;
}

// 0–5 star rating, mirrors the agents-table renderer (partial fill via fillPercent).
function RatingCellRenderer(params) {
  const v = params.value;
  if (v === null || v === undefined || v === '') {
    return <span className="flex items-center h-full text-xs text-muted-foreground">—</span>;
  }
  const rating = Number(v) || 0;
  const maxStars = 5;

  return (
    <div className="flex items-center h-full gap-[2px]" title={`${rating} / 5`}>
      {[...Array(maxStars)].map((_, i) => {
        const fillPercent = Math.min(Math.max(rating - i, 0), 1) * 100;
        return (
          <div key={i} className="relative w-4 h-4">
            <svg viewBox="0 0 24 24" className="absolute w-4 h-4 text-gray-400">
              <path
                fill="currentColor"
                d="M12 17.27L18.18 21l-1.64-7.03
                L22 9.24l-7.19-.61L12 2
                9.19 8.63 2 9.24l5.46
                4.73L5.82 21z"
              />
            </svg>
            <div
              className="absolute top-0 left-0 overflow-hidden"
              style={{ width: `${fillPercent}%` }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-yellow-400">
                <path
                  fill="currentColor"
                  d="M12 17.27L18.18 21l-1.64-7.03
                  L22 9.24l-7.19-.61L12 2
                  9.19 8.63 2 9.24l5.46
                  4.73L5.82 21z"
                />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecordingCellRenderer(params) {
  const row = params.data;
  return (
    <RecordingCell
      link={row?.recording_link}
      filename={row?.recording_filename}
      lengthSec={row?.length_in_sec}
      agentName={row?.vici_call_agent || row?.agent_name || row?.agent_user}
      phone={row?.phone}
    />
  );
}

function AgentCellRenderer(params) {
  // Reads the column value, not the row, so what is shown is exactly what the
  // header filter matches on.
  return <span className="text-xs text-foreground/80">{params.value || '—'}</span>;
}

// ────────── Custom-column cells (admin-defined) ──────────
// Values live under row.custom_fields[name]; edits accumulate as a per-lead delta in
// context.customDraftsRef and are persisted (PATCH) by the shared row Save button.

// Coerce any stored value into an array for multiselect (legacy strings → single-element array).
const toValueArray = (v) => {
  if (Array.isArray(v)) return v.filter((x) => x !== null && x !== undefined && x !== '');
  if (v === null || v === undefined || v === '') return [];
  return [v];
};

function writeCustomDraft(params, value) {
  const { customDraftsRef, markDirty } = params.context;
  const leadId = params.data.lead_id;
  const name = params.fieldDef.name;
  customDraftsRef.current[leadId] = {
    ...(customDraftsRef.current[leadId] ?? {}),
    [name]: value,
  };
  markDirty(leadId);
}

// Reads the live value for a cell: the draft delta wins over the stored value.
function readCustomValue(params) {
  const { customDraftsRef } = params.context;
  const { name } = params.fieldDef;
  const draft = customDraftsRef.current[params.data.lead_id];
  if (draft && name in draft) return draft[name];
  return params.data.custom_fields?.[name];
}

function CustomTextCell({ params }) {
  const { canEdit } = params.context;
  const row = params.data;
  const stored = row.custom_fields?.[params.fieldDef.name];
  if (!canEdit(row)) {
    return <span className="text-xs text-muted-foreground">{stored ? String(stored) : '—'}</span>;
  }
  return (
    <input
      type="text"
      ref={(el) => {
        if (!el) return;
        el.value = readCustomValue(params) ?? '';
      }}
      placeholder="—"
      onChange={(e) => writeCustomDraft(params, e.target.value)}
      className={inputCls}
    />
  );
}

function CustomSelectCell({ params }) {
  const { canEdit } = params.context;
  const row = params.data;
  const { options = [] } = params.fieldDef;
  const stored = row.custom_fields?.[params.fieldDef.name];
  if (!canEdit(row)) {
    return <span className="text-xs text-muted-foreground">{stored ? String(stored) : '—'}</span>;
  }
  return (
    <select
      ref={(el) => {
        if (!el) return;
        el.value = readCustomValue(params) ?? '';
      }}
      onChange={(e) => writeCustomDraft(params, e.target.value)}
      className={inputCls}
    >
      <option value="">—</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function CustomMultiSelectCell({ params }) {
  const { canEdit, theme } = params.context;
  const row = params.data;
  const { name, options = [] } = params.fieldDef;
  const editable = canEdit(row);

  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [selected, setSelected] = useState(() => toValueArray(row.custom_fields?.[name]));

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (wrapRef.current && wrapRef.current.contains(e.target)) return;
      const popup = document.getElementById(`cf-popup-${row.lead_id}-${name}`);
      if (popup && popup.contains(e.target)) return;
      setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open, row.lead_id, name]);

  if (!editable) {
    return (
      <span className="text-xs text-muted-foreground">{selected.length ? selected.join(', ') : '—'}</span>
    );
  }

  const label = selected.length ? selected.join(', ') : 'Select…';
  const openMenu = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom, left: r.left, width: r.width });
    setOpen(true);
  };

  const toggle = (value) => {
    const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
    setSelected(next);
    writeCustomDraft(params, next);
  };

  return (
    <div ref={wrapRef} className="relative w-full h-full flex items-center">
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        title={label}
        className={`w-full flex items-center justify-between gap-1 rounded-md border border-input bg-input/40 px-2 py-1 text-xs text-left transition-smooth
          ${selected.length ? 'text-foreground' : 'text-muted-foreground'} ${open ? 'border-primary/60' : 'hover:border-primary/40'}`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={`w-3 h-3 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && pos && createPortal(
        <div
          id={`cf-popup-${row.lead_id}-${name}`}
          data-theme={theme}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 1000 }}
          className="rv-scope rounded-md border border-border bg-card shadow-lg overflow-hidden max-h-56 overflow-y-auto scrollbar-thin"
        >
          {options.length === 0 ? (
            <div className="px-2 py-2 text-xs text-muted-foreground italic">No options</div>
          ) : (
            options.map((opt) => {
              const active = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left transition-smooth
                    ${active ? 'bg-primary/15 text-foreground' : 'text-foreground/80 hover:bg-secondary/40'}`}
                >
                  <span className={`h-3.5 w-3.5 rounded border grid place-items-center shrink-0 transition-smooth
                    ${active ? 'bg-primary/30 border-primary/60' : 'border-border'}`}>
                    {active && <Check className="w-2.5 h-2.5 text-primary" />}
                  </span>
                  <span className="truncate">{opt}</span>
                </button>
              );
            })
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

function CustomReadOnlyCell({ params }) {
  const v = params.data.custom_fields?.[params.fieldDef.name];
  const text = Array.isArray(v) ? v.join(', ') : v !== null && v !== undefined && v !== '' ? String(v) : '—';
  return <span className="text-xs text-muted-foreground">{text}</span>;
}

function CustomFieldCellRenderer(params) {
  switch (params.fieldDef?.type) {
    case 'text':
      return <CustomTextCell params={params} />;
    case 'select':
      return <CustomSelectCell params={params} />;
    case 'multiselect':
      return <CustomMultiSelectCell params={params} />;
    default:
      return <CustomReadOnlyCell params={params} />;
  }
}

// ────────── Grid wrapper ──────────

export default function HotLeadsGrid({ rows, currentUser, isAdmin, formFields = [], onRowClick, theme = 'dark' }) {
  const { error: toastError } = useToast();
  const maskPii = useSelector(selectMaskPii);
  const [updateLead] = useUpdateHotMetaLeadMutation();
  const [updateCustomFields] = useUpdateHotMetaLeadCustomFieldsMutation();
  const gridRef = useRef(null);
  const draftsRef = useRef({});
  const customDraftsRef = useRef({});

  const [dirtySet, setDirtySet] = useState(() => new Set());
  const [savingId, setSavingId] = useState(null);
  const [savedSet, setSavedSet] = useState(() => new Set());

  const canEdit = useCallback(
    (row) =>
      row.lead_id != null &&
      (isAdmin || !row.agent_user || row.agent_user === currentUser?.user),
    [isAdmin, currentUser],
  );

  const markDirty = useCallback((leadId) => {
    setDirtySet((prev) => {
      if (prev.has(leadId)) return prev;
      const next = new Set(prev);
      next.add(leadId);
      return next;
    });
    setSavedSet((prev) => {
      if (!prev.has(leadId)) return prev;
      const next = new Set(prev);
      next.delete(leadId);
      return next;
    });
  }, []);

  const handleSave = useCallback(
    async (row) => {
      const leadId = row.lead_id;
      const stdDraft = draftsRef.current[leadId];
      const custDraft = customDraftsRef.current[leadId];
      if (!stdDraft && !custDraft) return;
      setSavingId(leadId);
      try {
        // Fire only the groups that actually changed: standard note fields via PUT, custom-column
        // values via the dedicated PATCH (delta merge). Both hit the getHotMetaLeads cache row.
        const calls = [];
        if (stdDraft) {
          calls.push(
            updateLead({
              leadId,
              currentUser,
              body: {
                ...stdDraft,
                agent_name: currentUser?.full_name || currentUser?.user || '',
              },
            }).unwrap(),
          );
        }
        if (custDraft) {
          calls.push(
            updateCustomFields({ leadId, body: { custom_fields: custDraft } }).unwrap(),
          );
        }
        await Promise.all(calls);

        delete draftsRef.current[leadId];
        delete customDraftsRef.current[leadId];
        setDirtySet((prev) => {
          if (!prev.has(leadId)) return prev;
          const next = new Set(prev);
          next.delete(leadId);
          return next;
        });
        setSavedSet((prev) => {
          const next = new Set(prev);
          next.add(leadId);
          return next;
        });
      } catch (e) {
        toastError(`Save failed: ${e?.data?.detail || e?.error || e?.message || 'unknown error'}`);
      } finally {
        setSavingId(null);
      }
    },
    [updateLead, updateCustomFields, currentUser, toastError],
  );

  // Refresh only the action column when the per-row save state changes —
  // never the editable input cells, so typing keeps focus.
  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    api.refreshCells({ columns: ['__action'], force: true });
  }, [dirtySet, savingId, savedSet]);

  const context = useMemo(
    () => ({
      canEdit,
      draftsRef,
      customDraftsRef,
      markDirty,
      dirtySet,
      savingId,
      savedSet,
      onSave: handleSave,
      theme,
    }),
    [canEdit, markDirty, dirtySet, savingId, savedSet, handleSave, theme],
  );

  // Column ids whose cells are interactive (inline-edit widgets, popovers, or the Save action).
  // A click on one of these should keep its own behaviour, not open the row-detail modal.
  const INTERACTIVE_COLS = useMemo(
    () => new Set([
      'how_contacted', 'response', 'client_registered', 'client_deposited',
      'call_rating', 'recording_link', 'raw_data', 'call_summary', '__action',
    ]),
    [],
  );

  // Open the detail modal on a row click, but only from a non-interactive cell (and never from a
  // click that lands on an actual control), so inline editing keeps working.
  const handleCellClicked = useCallback(
    (e) => {
      if (!onRowClick) return;
      const colId = e.column?.getColId?.() ?? '';
      if (INTERACTIVE_COLS.has(colId) || colId.startsWith('cf__')) return;
      if (e.event?.target?.closest?.('button, input, select, textarea, a, [role="button"]')) return;
      onRowClick(e.data);
    },
    [onRowClick, INTERACTIVE_COLS],
  );

  const columnDefs = useMemo(() => {
    // One column per admin-defined custom field, rendered/edited by type. Inserted before the
    // pinned Action column. colId is derived from the (unique) field name so AG Grid keeps
    // per-column state stable across re-renders.
    const customCols = (formFields ?? []).map((field) => ({
      headerName: field.name,
      colId: `cf__${field.name}`,
      width: 180,
      sortable: false,
      filter: false,
      valueGetter: (p) => p.data?.custom_fields?.[field.name],
      cellRenderer: CustomFieldCellRenderer,
      cellRendererParams: { fieldDef: field },
    }));

    return [
      {
        headerName: 'Lead ID',
        field: 'lead_id',
        width: 70,
        pinned: 'left',
        cellClass: 'font-mono text-muted-foreground',
      },
       {
        headerName: 'Call Date and Time',
        field: 'call_date',
        width: 160,
        valueFormatter: (p) => shortDate(p.value),
        cellClass: 'font-mono-nums text-muted-foreground',
      },
      {
        headerName: 'Created date and time',
        field: 'inserted_date',
        width: 180,
        valueFormatter: (p) => shortDate(p.value),
        cellClass: 'font-mono-nums text-muted-foreground',
      },
      {
        headerName: 'Campaign Name',
        field: 'campaign_name',
        width: 180,
        tooltipField: 'campaign_name',
      },
      {
        headerName: 'Ad Set Name',
        field: 'ad_set_name',
        width: 180,
        tooltipField: 'ad_set_name',
      },
      {
        headerName: 'Ad Name',
        field: 'ad_name',
        width: 180,
        tooltipField: 'ad_name',
      },
      {
        headerName: 'Form Name',
        field: 'form_name',
        width: 180,
        tooltipField: 'form_name',
      },
      
      {
        headerName: 'Customer Name',
        colId: 'customer_name',
        valueGetter: (p) => p.data?.name || p.data?.vici_call_first_name || '',
        width: 140,
        cellClass: 'font-medium text-foreground',
      },
      {
        headerName: 'Phone Number',
        field: 'phone',
        width: 130,
        cellRenderer: (p) => (
          <span className="font-mono text-primary select-text cursor-text">
            {maskPii ? maskPhone(p.value) : p.value}
          </span>
        ),
      },
      {
        headerName: 'Email',
        colId: 'email',
        valueGetter: (p) => {
          const raw = p.data?.email || p.data?.vici_call_email || '';
          return maskPii ? maskEmail(raw) : raw;
        },
        tooltipValueGetter: (p) => p.value,
        width: 200,
        cellClass: 'text-foreground/90',
      },
      {
        headerName: 'Form Details',
        field: 'raw_data',
        width: 180,
        sortable: false,
        filter: false,
        cellRenderer: RawDataCellRenderer,
      },
      {
        headerName: 'IB',
        colId: 'is_ib',
        width: 80,
        headerTooltip:
          'Introducing broker — Yes when the lead was routed into the IB list (7022026), ' +
          'No when it went to the general list (971585658633)',
        valueGetter: (p) => ibLabel(p.data?.is_ib),
        cellRenderer: IbCellRenderer,
      },
      {
        headerName: 'Agent Name',
        colId: '__agent',
        width: 140,
        // The agent reaches the row under three different keys depending on which
        // endpoint filled it, so the column needs a valueGetter: with neither this nor
        // a `field`, ag-grid sees undefined for every row and the header filter (and
        // sort, and export) has nothing to match on. '' rather than the display dash,
        // so an unassigned lead does not filter as if the dash were a name.
        valueGetter: (p) =>
          p.data?.vici_call_agent || p.data?.agent_name || p.data?.agent_user || '',
        cellRenderer: AgentCellRenderer,
      },
     
      {
        headerName: 'Call Disposition',
        field: 'vici_call_status',
        width: 140,
        cellRenderer: ViciLeadStatusCellRenderer,
      },
      {
        headerName: 'Call Response',
        field: 'vici_call_comments',
        width: 200,
        tooltipField: 'vici_call_comments',
        cellClass: 'text-foreground/90',
      },

      
      {
        headerName: 'Recording',
        field: 'recording_link',
        width: 300,
        sortable: false,
        filter: false,
        cellRenderer: RecordingCellRenderer,
      },
      // {
      //   headerName: 'Follow-up Via',
      //   field: 'how_contacted',
      //   width: 170,
      //   sortable: false,
      //   filter: false,
      //   cellRenderer: ContactCellRenderer,
      // },
      // {
      //   headerName: 'Follow-up Response',
      //   field: 'response',
      //   width: 220,
      //   sortable: false,
      //   filter: false,
      //   cellRenderer: ResponseCellRenderer,
      // },
      // {
      //   headerName: 'Registered Status',
      //   field: 'client_registered',
      //   width: 130,
      //   sortable: false,
      //   filter: false,
      //   cellRenderer: RegisteredCellRenderer,
      // },
      // {
      //   headerName: 'Deposited Status',
      //   field: 'client_deposited',
      //   width: 130,
      //   sortable: false,
      //   filter: false,
      //   cellRenderer: DepositedCellRenderer,
      // },
      {
        headerName: 'Call Rating',
        field: 'call_rating',
        width: 120,
        filter: false,
         cellClass: 'flex items-center',
        cellRenderer: RatingCellRenderer,
      },
      {
        headerName: 'Call Summary',
        field: 'call_summary',
        width: 180,
        sortable: false,
        filter: false,
        cellRenderer: SummaryCellRenderer,
      },
      
      
      // {
      //   headerName: 'Transcript',
      //   field: 'transcript_text',
      //   width: 180,
      //   sortable: false,
      //   filter: false,
      //   cellRenderer: TranscriptCellRenderer,
      // },
      {
        headerName: 'First Status',
        field: 'first_status_change',
        width: 160,
        valueFormatter: (p) => shortDate(p.value),
        cellClass: 'font-mono-nums text-muted-foreground',
      },
      {
        headerName: 'Latest Status',
        field: 'last_status_change',
        width: 160,
        valueFormatter: (p) => shortDate(p.value),
        cellClass: 'font-mono-nums text-muted-foreground',
      },

      ...customCols,
      {
        headerName: 'Action',
        colId: '__action',
        width: 110,
        pinned: 'right',
        sortable: false,
        filter: false,
        cellRenderer: ActionCellRenderer,
      },
    ];
  }, [formFields, maskPii]);

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      suppressMovable: true,
      filter: 'agTextColumnFilter',
      // floatingFilter: true,
      filterParams: { buttons: ['reset'], debounceMs: 200 },
    }),
    [],
  );

  // Light/dark AG-Grid theme, shared with the manager-view grids (agThemeDark mirrors the previous
  // inline dark theme; agThemeLight gives the navy-header + white-rows spreadsheet look).
  const agTheme = useMemo(() => gridTheme(theme), [theme]);

  const getRowId = useCallback(
    (p) =>
      p.data.lead_id != null
        ? `lead-${p.data.lead_id}`
        : `nolead-${p.data.phone ?? ''}-${p.data.call_date ?? ''}-${p.data.vici_call_email ?? p.data.email ?? ''}`,
    [],
  );

  // Flag "Meta Quotes" lead-source rows with a subtle theme tint (see index.css).
  const rowClassRules = useMemo(
    () => ({
      'meta-quotes-row': (p) =>
        (p.data?.vici_call_last_name ?? '').trim() === 'Meta Quotes',
    }),
    [],
  );

  return (
    <div className="h-[calc(100vh-10rem)] min-h-[840px] [&_.ag-row]:cursor-pointer">
      <AgGridReact
        ref={gridRef}
        rowData={rows}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        theme={agTheme}
        context={context}
        getRowId={getRowId}
        rowClassRules={rowClassRules}
        onCellClicked={handleCellClicked}
        suppressCellFocus
        suppressRowClickSelection
        enableCellTextSelection
        domLayout="normal"
      />
    </div>
  );
}
