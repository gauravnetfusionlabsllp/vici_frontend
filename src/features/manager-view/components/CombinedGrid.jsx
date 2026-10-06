import { useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { AgGridReact } from 'ag-grid-react';
import { Star } from 'lucide-react';

import BoolBadge from '@/features/reporting/components/BoolBadge';
import { selectMaskPii } from '@/features/auth/slices/authSlice';
import { maskPhone } from '@/shared/lib/mask';
import { gridTheme, defaultColDef } from './gridConfig';
import GridToolbar from './GridToolbar';
import { callerOf, fmtDateTime } from '../utils';
import { useMvTheme } from '../theme';

// ── cell renderers (module scope so columnDefs stay stable) ──

function StarsRenderer(params) {
  const n = Math.round(Number(params.value) || 0);
  if (!n) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i < n ? 'text-[hsl(var(--status-waiting))] fill-[hsl(var(--status-waiting))]' : 'text-border'}`}
        />
      ))}
    </span>
  );
}

function RatingRenderer(params) {
  const v = Number(params.value);
  if (!Number.isFinite(v)) return <span className="text-xs text-muted-foreground">—</span>;
  const tone =
    v >= 7 ? 'text-[hsl(var(--status-active))] border-[hsl(var(--status-active)/0.35)] bg-[hsl(var(--status-active)/0.12)]'
    : v >= 4 ? 'text-[hsl(var(--status-waiting))] border-[hsl(var(--status-waiting)/0.35)] bg-[hsl(var(--status-waiting)/0.12)]'
    : 'text-destructive border-destructive/35 bg-destructive/12';
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold font-mono-nums ${tone}`}>
      {v.toFixed(1)}
    </span>
  );
}

const textFmt = (p) => (p.value === null || p.value === undefined || p.value === '' ? '—' : p.value);

export default function CombinedGrid({ rows, onRowClick }) {
  const gridRef = useRef(null);
  const theme = useMvTheme();
  const maskPii = useSelector(selectMaskPii);

  const columnDefs = useMemo(
    () => [
      { headerName: 'Call Date', field: 'call_date', width: 150, valueFormatter: (p) => fmtDateTime(p.value), cellClass: 'font-mono-nums text-muted-foreground' },
      // The CALLER, by name. This used to show the follow-up note's author, else a user id.
      { headerName: 'Called By', colId: 'agent', width: 150, valueGetter: (p) => callerOf(p.data) || '', valueFormatter: textFmt, cellClass: 'text-foreground/85' },
      { headerName: 'Client Name', field: 'name', width: 150, valueFormatter: textFmt, cellClass: 'font-medium text-foreground' },
      { headerName: 'Phone', field: 'phone', width: 140, cellClass: 'font-mono text-primary', valueFormatter: (p) => (p.value === null || p.value === undefined || p.value === '' ? '—' : (maskPii ? maskPhone(p.value) : p.value)) },
      { headerName: 'Call Result', field: 'call_result', width: 170, valueFormatter: textFmt, headerTooltip: 'Did the client pick up and talk?' },
      { headerName: 'Lead Status', field: 'vici_status_name', width: 160, valueFormatter: textFmt, headerTooltip: 'Where the lead stands now in the dialer', cellClass: 'text-foreground/85' },
      { headerName: 'Ad Campaign', field: 'campaign_name', width: 170, tooltipField: 'campaign_name', valueFormatter: textFmt },
      { headerName: 'Ad Set', field: 'ad_set_name', width: 160, tooltipField: 'ad_set_name', valueFormatter: textFmt },
      { headerName: 'Ad', field: 'ad_name', width: 160, tooltipField: 'ad_name', valueFormatter: textFmt },
      { headerName: 'Form', field: 'form_name', width: 160, tooltipField: 'form_name', valueFormatter: textFmt },
      { headerName: 'Call Outcome (AI)', field: 'call_outcome', width: 150, valueFormatter: textFmt, headerTooltip: 'AI reading of the conversation' },
      { headerName: 'Rating', field: 'overall_rating', width: 100, cellClass: 'flex items-center', cellRenderer: RatingRenderer, filter: 'agNumberColumnFilter', headerTooltip: 'AI score of the call, out of 10' },
      { headerName: 'Stars', field: 'call_stars', width: 120, cellClass: 'flex items-center', cellRenderer: StarsRenderer, filter: 'agNumberColumnFilter' },
      { headerName: 'Account Opened', field: 'client_registered', width: 130, cellClass: 'flex items-center', cellRenderer: (p) => <BoolBadge value={p.value} /> },
      { headerName: 'Deposited', field: 'client_deposited', width: 115, cellClass: 'flex items-center', cellRenderer: (p) => <BoolBadge value={p.value} /> },
      { headerName: 'Lead Owner', field: 'lead_owner_name', width: 150, valueFormatter: textFmt, headerTooltip: 'Agent responsible for this lead' },
      { headerName: 'Times Called', field: 'times_called', width: 110, filter: 'agNumberColumnFilter', valueFormatter: textFmt, cellClass: 'font-mono-nums' },
      { headerName: 'Agent Notes', field: 'response', width: 200, tooltipField: 'response', valueFormatter: textFmt, cellClass: 'text-foreground/85' },
      { headerName: 'Notes By', field: 'note_by', width: 140, valueFormatter: textFmt },
    ],
    [maskPii],
  );

  const onRowClicked = useCallback((e) => onRowClick?.(e.data), [onRowClick]);

  const getRowId = useCallback(
    (p) => (p.data.call_id != null ? `call-${p.data.call_id}` : `row-${p.data.phone ?? ''}-${p.data.call_date ?? ''}`),
    [],
  );

  return (
    <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
      <GridToolbar gridRef={gridRef} base="manager-view-calls" count={rows.length} />
      <div className="h-[calc(100vh-14rem)] min-h-[520px] [&_.ag-row]:cursor-pointer">
        <AgGridReact
          ref={gridRef}
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          theme={gridTheme(theme)}
          getRowId={getRowId}
          onRowClicked={onRowClicked}
          pagination
          paginationPageSize={50}
          paginationPageSizeSelector={[25, 50, 100, 200]}
          suppressCellFocus
          enableCellTextSelection
          domLayout="normal"
        />
      </div>
    </div>
  );
}
