import { useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';

import { ibLabel, shortDate } from '@/features/reporting/utils';
import RawDataCell from '@/features/reporting/components/RawDataCell';
import BoolBadge from '@/features/reporting/components/BoolBadge';
import { selectMaskPii } from '@/features/auth/slices/authSlice';
import { maskEmail, maskPhone } from '@/shared/lib/mask';

ModuleRegistry.registerModules([AllCommunityModule]);

const RawFieldsCellRenderer = (p) => <RawDataCell data={p.value} />;

// IB = the form answer names "introducing broker" (see isIntroducingBroker for the questions).
// Mirrors the hot-leads grid: valueGetter keeps 'Yes'/'No'/'' so sort, filter and export work.
const IbCellRenderer = (p) => (
  <BoolBadge value={p.value === 'Yes' ? true : p.value === 'No' ? false : null} />
);

const AgentCellRenderer = (p) => (
  <span className="text-xs text-foreground/80">{p.value || '—'}</span>
);

export default function MetaLeadsGrid({ rows }) {
  const gridRef = useRef(null);
  const maskPii = useSelector(selectMaskPii);

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Lead ID',
        field: 'id',
        width: 80,
        pinned: 'left',
        cellClass: 'font-mono text-muted-foreground',
      },
      {
        headerName: 'Created',
        field: 'created_at',
        width: 170,
        valueFormatter: (p) => shortDate(p.value),
        cellClass: 'font-mono-nums text-muted-foreground',
      },
      {
        headerName: 'Campaign Name',
        field: 'campaign_name',
        width: 200,
        tooltipField: 'campaign_name',
      },
      {
        headerName: 'Ad Set Name',
        field: 'adset_name',
        width: 180,
        tooltipField: 'adset_name',
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
        width: 200,
        tooltipField: 'form_name',
      },
      {
        headerName: 'Name',
        colId: '__name',
        width: 160,
        valueGetter: (p) =>
          [p.data?.first_name, p.data?.last_name].filter(Boolean).join(' ').trim() || '—',
        cellClass: 'font-medium text-foreground',
      },
      {
        headerName: 'Phone',
        field: 'phone_number',
        width: 140,
        cellRenderer: (p) => (
          <span className="font-mono text-primary select-text cursor-text">
            {maskPii ? maskPhone(p.value) : p.value}
          </span>
        ),
      },
      {
        headerName: 'Email',
        field: 'email',
        width: 220,
        valueFormatter: (p) => (maskPii ? maskEmail(p.value) : p.value),
        tooltipValueGetter: (p) => (maskPii ? maskEmail(p.value) : p.value),
        cellClass: 'text-foreground/90',
      },
      {
        headerName: 'Source',
        field: 'source',
        width: 120,
      },
      {
        headerName: 'Account',
        field: 'account_name',
        width: 180,
        tooltipField: 'account_name',
      },
      {
        headerName: 'Is Called',
        field: 'is_called',
        width: 130,
        cellDataType: false,
        valueGetter: (p) => (p.data?.is_called ? 'Yes' : 'No'),
      },
      {
        headerName: 'Call Count',
        field: 'call_count',
        width: 120,
        tooltipField: 'call_count',
      },
      {
        headerName: 'Form Details',
        field: 'raw_fields',
        width: 200,
        sortable: false,
        filter: false,
        cellRenderer: RawFieldsCellRenderer,
      },
      {
        headerName: 'IB',
        colId: 'is_ib',
        width: 80,
        headerTooltip:
          'Introducing broker — from the "which best describes you" / "which opportunity are you interested in" form answer',
        valueGetter: (p) => ibLabel(p.data?.raw_fields),
        cellClass: 'flex items-center',
        cellRenderer: IbCellRenderer,
      },
      {
        headerName: 'Agent Name',
        colId: '__agent',
        width: 140,
        headerTooltip:
          'Agent the lead is assigned to (vicidial_list.user), set the moment it arrives. ' +
          'Falls back to the agent who dialed it if the lead carries no assignment.',
        valueGetter: (p) =>
          p.data?.assigned_to || p.data?.assigned_user || p.data?.agent_name || p.data?.called_by || '',
        cellRenderer: AgentCellRenderer,
      },
    ],
    [maskPii],
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      suppressMovable: true,
      filter: 'agTextColumnFilter',
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

  const getRowId = useCallback((p) => String(p.data.id), []);

  return (
    <div className="h-[calc(100vh-10rem)] min-h-[840px]">
      <AgGridReact
        ref={gridRef}
        rowData={rows}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        theme={agTheme}
        getRowId={getRowId}
        suppressCellFocus
        suppressRowClickSelection
        enableCellTextSelection
        domLayout="normal"
      />
    </div>
  );
}
