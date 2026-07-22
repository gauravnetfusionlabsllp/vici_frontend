import { useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';

import { gridTheme, defaultColDef } from './gridConfig';
import GridToolbar from './GridToolbar';
import { useMvTheme } from '../theme';

// Generic grid used by the three standalone tabs (Call Analysis / Meta Leads / Hot Notes).
export default function StandaloneGrid({ rows, columnDefs, base, getRowId, context }) {
  const gridRef = useRef(null);
  const theme = useMvTheme();
  return (
    <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
      <GridToolbar gridRef={gridRef} base={base} count={rows.length} />
      <div className="h-[calc(100vh-16rem)] min-h-[480px]">
        <AgGridReact
          ref={gridRef}
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          theme={gridTheme(theme)}
          context={context}
          getRowId={getRowId}
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
