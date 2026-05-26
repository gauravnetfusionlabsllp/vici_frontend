import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { Loader2, Save, CheckCircle, Download } from 'lucide-react';

import { useUpdateHotMetaLeadMutation } from '@/services';
import { useToast } from '@/shared/hooks/useToast';
import { DISPOSITIONS } from '@/features/leads/constants';
import { CONTACT_OPTIONS } from '../constants';
import { shortDate } from '../utils';
import BoolBadge from './BoolBadge';
import RawDataCell from './RawDataCell';

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

function baseDraft(row) {
  return {
    how_contacted: row.how_contacted ?? '',
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
  if (!canEdit(row)) {
    return <span className="text-xs text-muted-foreground">{row.how_contacted || '—'}</span>;
  }
  return (
    <select
      ref={(el) => {
        if (!el) return;
        const draft = draftsRef.current[row.lead_id];
        el.value = draft?.how_contacted ?? row.how_contacted ?? '';
      }}
      onChange={(e) => {
        draftsRef.current[row.lead_id] = {
          ...(draftsRef.current[row.lead_id] ?? baseDraft(row)),
          how_contacted: e.target.value,
        };
        markDirty(row.lead_id);
      }}
      className={inputCls}
    >
      {CONTACT_OPTIONS.map((o) => (
        <option key={o} value={o}>{o || 'Select…'}</option>
      ))}
    </select>
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

function fmtDuration(sec) {
  const n = Number(sec);
  if (!Number.isFinite(n) || n <= 0) return null;
  const s = Math.floor(n);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function RecordingCellRenderer(params) {
  const row = params.data;
  const link = row.recording_link;
  if (!link) return <span className="text-xs text-muted-foreground">—</span>;

  const downloadName = row.recording_filename ? `${row.recording_filename}.mp3` : true;
  const duration = fmtDuration(row.length_in_sec);

  return (
    <div className="flex items-center gap-2 w-full">
      <audio
        controls
        preload="none"
        src={link}
        title={row.recording_filename || 'Call recording'}
        className="h-8 flex-1 min-w-0 max-w-[220px]"
      />
      {duration && (
        <span className="text-[10px] font-mono-nums text-muted-foreground tabular-nums">
          {duration}
        </span>
      )}
      <a
        href={link}
        download={downloadName}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth shrink-0"
        title="Download recording"
      >
        <Download className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

function AgentCellRenderer(params) {
  const row = params.data;
  return <span className="text-xs text-foreground/80">{row.agent_name || row.agent_user || '—'}</span>;
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
    (row) => isAdmin || !row.agent_user || row.agent_user === currentUser?.user,
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
        width: 90,
        pinned: 'left',
        cellClass: 'font-mono text-muted-foreground',
      },
      
      {
        headerName: 'Campaign',
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
        headerName: 'Inserted',
        field: 'inserted_date',
        width: 160,
        valueFormatter: (p) => shortDate(p.value),
        cellClass: 'font-mono-nums text-muted-foreground',
      },
      {
        headerName: 'Call Date',
        field: 'call_date',
        width: 160,
        valueFormatter: (p) => shortDate(p.value),
        cellClass: 'font-mono-nums text-muted-foreground',
      },
      
      {
        headerName: 'Name',
        field: 'name',
        width: 140,
        cellClass: 'font-medium text-foreground',
      },
      {
        headerName: 'Phone',
        field: 'phone',
        width: 130,
        cellClass: 'font-mono text-primary',
      },
      {
        headerName: 'Email',
        field: 'email',
        width: 200,
        tooltipField: 'email',
        cellClass: 'text-foreground/90',
      },
      {
        headerName: 'Raw Data',
        field: 'raw_data',
        width: 180,
        sortable: false,
        filter: false,
        cellRenderer: RawDataCellRenderer,
      },
      {
        headerName: 'Agent',
        colId: '__agent',
        width: 140,
        valueGetter: (p) => p.data.agent_name || p.data.agent_user || '—',
        cellRenderer: AgentCellRenderer,
      },
      {
        headerName: 'Vici Status',
        field: 'vici_lead_status',
        width: 140,
        cellRenderer: ViciLeadStatusCellRenderer,
      },
      {
        headerName: 'Recording',
        field: 'recording_link',
        width: 300,
        sortable: false,
        filter: false,
        cellRenderer: RecordingCellRenderer,
      },
      {
        headerName: 'How Contacted',
        field: 'how_contacted',
        width: 170,
        sortable: false,
        filter: false,
        cellRenderer: ContactCellRenderer,
      },
      {
        headerName: 'Response',
        field: 'response',
        width: 220,
        sortable: false,
        filter: false,
        cellRenderer: ResponseCellRenderer,
      },
      {
        headerName: 'Registered',
        field: 'client_registered',
        width: 130,
        sortable: false,
        filter: false,
        cellRenderer: RegisteredCellRenderer,
      },
      {
        headerName: 'Deposited',
        field: 'client_deposited',
        width: 130,
        sortable: false,
        filter: false,
        cellRenderer: DepositedCellRenderer,
      },
      {
        headerName: 'First Status',
        field: 'first_status_change',
        width: 160,
        valueFormatter: (p) => shortDate(p.value),
        cellClass: 'font-mono-nums text-muted-foreground',
      },
      {
        headerName: 'Last Status',
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
        headerHeight: 40,
        floatingFiltersHeight: 36,
        rowHeight: 48,
        wrapperBorderRadius: 0,
        fontFamily: 'Inter, sans-serif',
      }),
    [],
  );

  const getRowId = useCallback((p) => String(p.data.lead_id), []);

  return (
    <div className="h-[calc(100vh-22rem)] min-h-[420px]">
      <AgGridReact
        ref={gridRef}
        rowData={rows}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        theme={agTheme}
        context={context}
        getRowId={getRowId}
        suppressCellFocus
        suppressRowClickSelection
        domLayout="normal"
      />
    </div>
  );
}
