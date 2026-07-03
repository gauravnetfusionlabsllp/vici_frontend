import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { Loader2, Save, CheckCircle, Download, ChevronDown, Check } from 'lucide-react';

import { useUpdateHotMetaLeadMutation, useDownloadRecordingMutation } from '@/services';
import { useToast } from '@/shared/hooks/useToast';
import { DISPOSITIONS } from '@/features/leads/constants';
import { CONTACT_OPTIONS } from '../constants';
import { shortDate } from '../utils';
import BoolBadge from './BoolBadge';
import RawDataCell from './RawDataCell';
import ExpandableTextCell from './ExpandableTextCell';
import RecordingPlayer from './RecordingPlayer';

const DISPOSITION_LABEL = DISPOSITIONS.reduce((acc, d) => {
  acc[d.value] = d.label;
  return acc;
}, {});

// Disposition code → tone bucket. Tones map to the project's status tokens.
const DISPOSITION_TONE = {
  CON:  'active',   // Converted
  IN:   'active',   // Interested
  CBR:  'primary',  // Callback
  C:    'neutral',  // Completed
  B:    'warn',     // Busy
  N:    'warn',     // No Answer
  NI:   'danger',   // Not Interested
  D:    'danger',   // Disconnected
  INVN: 'danger',   // Invalid Number
  WN:   'danger',   // Wrong Number
  FUC:  'primary',  // Follow Up
  INCALL: 'active',   // In Call (internal-only status for live calls)
};

const TONE_CLS = {
  active:  'text-[hsl(var(--status-active))]',
  warn:    'text-[hsl(var(--status-waiting))]',
  danger:  'text-destructive',
  primary: 'text-primary',
  neutral: 'text-foreground/80',
};

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
  const { canEdit, draftsRef, markDirty } = params.context;
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
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 1000 }}
          className="rounded-md border border-border bg-card shadow-lg overflow-hidden"
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
  const code = (params.value ?? '').toString().trim().toUpperCase();
  if (!code) return <span className="text-xs text-muted-foreground">—</span>;

  const label = DISPOSITION_LABEL[code];
  const tone = DISPOSITION_TONE[code] ?? 'neutral';

  return (
    <span className={`text-xs ${TONE_CLS[tone]}`} title={label ? `${label} (${code})` : code}>
      {label ?? code}
      {label && <span className="ml-1 text-muted-foreground font-mono text-[10px]">({code})</span>}
    </span>
  );
}

function RawDataCellRenderer(params) {
  return <RawDataCell data={params.value} />;
}

function SummaryCellRenderer(params) {
  return <ExpandableTextCell text={params.value} title="Call summary" />;
}

function TranscriptCellRenderer(params) {
  return <ExpandableTextCell text={params.value} title="Transcript" />;
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

// Strips characters that aren't safe in a filename, collapsing runs to a single underscore.
function fileSafe(value) {
  return String(value ?? '').trim().replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '');
}

// Saves a download from an object-URL string under `fileName` with no page navigation or flash (a
// blob object URL is same-origin, so the browser honors the `download` filename), then releases it.
function saveObjectUrl(objectUrl, fileName) {
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function RecordingCellRenderer(params) {
  const { error: toastError } = useToast();
  const [triggerDownload, { isLoading }] = useDownloadRecordingMutation();
  const row = params.data;
  const link = row?.recording_link;

  // The raw recording_link is cross-origin (CORS blocks fetch), so we pull the file through our own
  // reporting proxy — which carries the Bearer token and is same-host (no CORS) — then save it as
  // <agent>_<phone>.mp3. The mutation returns a ready-made object-URL string.
  const handleDownload = async () => {
    if (!link || isLoading) return;
    const agent = row.vici_call_agent || row.agent_name || row.agent_user;
    try {
      const objectUrl = await triggerDownload({ recordingLink: link, agentName: agent, phone: row.phone }).unwrap();
      const name = `${fileSafe(agent) || 'recording'}_${fileSafe(row.phone)}.mp3`;
      saveObjectUrl(objectUrl, name);
    } catch {
      toastError('Could not download the recording. Please try again.');
    }
  };

  if (!link) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <div className="flex items-center gap-2 w-full">
      <RecordingPlayer
        src={link}
        title={row.recording_filename || 'Call recording'}
        lengthSec={row.length_in_sec}
      />
      <button
        type="button"
        onClick={handleDownload}
        disabled={isLoading}
        className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth shrink-0 disabled:opacity-50"
        title="Download recording"
      >
        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function AgentCellRenderer(params) {
  const row = params.data;
  return <span className="text-xs text-foreground/80">{row.vici_call_agent||row.agent_name || row.agent_user || '—'}</span>;
}

// ────────── Grid wrapper ──────────

export default function HotLeadsGrid({ rows, currentUser, isAdmin }) {
  const { error: toastError } = useToast();
  const [updateLead] = useUpdateHotMetaLeadMutation();
  const gridRef = useRef(null);
  const draftsRef = useRef({});

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
      const draft = draftsRef.current[row.lead_id];
      if (!draft) return;
      setSavingId(row.lead_id);
      try {
        await updateLead({
          leadId: row.lead_id,
          currentUser,
          body: {
            ...draft,
            agent_name: currentUser?.full_name || currentUser?.user || '',
          },
        }).unwrap();

        delete draftsRef.current[row.lead_id];
        setDirtySet((prev) => {
          if (!prev.has(row.lead_id)) return prev;
          const next = new Set(prev);
          next.delete(row.lead_id);
          return next;
        });
        setSavedSet((prev) => {
          const next = new Set(prev);
          next.add(row.lead_id);
          return next;
        });
      } catch (e) {
        toastError(`Save failed: ${e?.data?.detail || e?.error || e?.message || 'unknown error'}`);
      } finally {
        setSavingId(null);
      }
    },
    [updateLead, currentUser, toastError],
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
      markDirty,
      dirtySet,
      savingId,
      savedSet,
      onSave: handleSave,
    }),
    [canEdit, markDirty, dirtySet, savingId, savedSet, handleSave],
  );

  const columnDefs = useMemo(
    () => [
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
          <span className="font-mono text-primary select-text cursor-text">{p.value}</span>
        ),
      },
      {
        headerName: 'Email',
        colId: 'email',
        valueGetter: (p) => p.data?.email || p.data?.vici_call_email || '',
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
        headerName: 'Agent Name',
        colId: '__agent',
        width: 140,
        // valueGetter: (p) => p.vici_call_agent || p.data.agent_name || p.data.agent_user || '—',
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
        headerName: 'Follow-up Via',
        field: 'how_contacted',
        width: 170,
        sortable: false,
        filter: false,
        cellRenderer: ContactCellRenderer,
      },
      {
        headerName: 'Follow-up Response',
        field: 'response',
        width: 220,
        sortable: false,
        filter: false,
        cellRenderer: ResponseCellRenderer,
      },
      {
        headerName: 'Registered Status',
        field: 'client_registered',
        width: 130,
        sortable: false,
        filter: false,
        cellRenderer: RegisteredCellRenderer,
      },
      {
        headerName: 'Deposited Status',
        field: 'client_deposited',
        width: 130,
        sortable: false,
        filter: false,
        cellRenderer: DepositedCellRenderer,
      },
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
      
      {
        headerName: 'Recording',
        field: 'recording_link',
        width: 300,
        sortable: false,
        filter: false,
        cellRenderer: RecordingCellRenderer,
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

      {
        headerName: 'Action',
        colId: '__action',
        width: 110,
        pinned: 'right',
        sortable: false,
        filter: false,
        cellRenderer: ActionCellRenderer,
      },
    ],
    [],
  );

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

  const agTheme = useMemo(
    () =>
      themeQuartz.withParams({
        backgroundColor: 'transparent',
        headerBackgroundColor: 'hsl(228 49% 15% / 0.85)',
        headerTextColor: 'hsl(220 15% 65%)',
        foregroundColor: 'hsl(220 40% 98%)',
        borderColor: 'hsl(220 49% 22% / 0.6)',
        rowHoverColor: 'hsl(228 49% 15% / 0.5)',
        oddRowBackgroundColor: 'hsl(229 56% 13% / 0.3)',
        selectedRowBackgroundColor: 'hsl(220 100% 59% / 0.1)',
        menuBackgroundColor: 'hsl(228 49% 12%)',
        dialogBackgroundColor: 'hsl(228 49% 12%)',
        headerHeight: 40,
        floatingFiltersHeight: 36,
        rowHeight: 40,
        wrapperBorderRadius: 0,
        fontFamily: 'Inter, sans-serif',
      }),
    [],
  );

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
    <div className="h-[calc(100vh-10rem)] min-h-[840px]">
      <AgGridReact
        ref={gridRef}
        rowData={rows}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        theme={agTheme}
        context={context}
        getRowId={getRowId}
        rowClassRules={rowClassRules}
        suppressCellFocus
        suppressRowClickSelection
        enableCellTextSelection
        domLayout="normal"
      />
    </div>
  );
}
