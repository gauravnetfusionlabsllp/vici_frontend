import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

// Dark grid theme (mirrors reporting/HotLeadsGrid).
export const agThemeDark = themeQuartz.withParams({
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
  rowHeight: 40,
  wrapperBorderRadius: 0,
  fontFamily: 'Inter, sans-serif',
});

// Light grid theme — navy header bar + white rows, matching the traditional-dashboard look.
export const agThemeLight = themeQuartz.withParams({
  backgroundColor: '#ffffff',
  headerBackgroundColor: 'hsl(218 44% 18%)',
  headerTextColor: '#ffffff',
  foregroundColor: 'hsl(222 44% 14%)',
  borderColor: 'hsl(214 28% 90%)',
  rowHoverColor: 'hsl(210 40% 95%)',
  oddRowBackgroundColor: 'hsl(210 40% 98%)',
  selectedRowBackgroundColor: 'hsl(212 72% 45% / 0.10)',
  menuBackgroundColor: '#ffffff',
  dialogBackgroundColor: '#ffffff',
  headerHeight: 40,
  rowHeight: 40,
  wrapperBorderRadius: 0,
  fontFamily: 'Inter, sans-serif',
});

// Back-compat alias (default = dark).
export const agTheme = agThemeDark;
export const gridTheme = (theme) => (theme === 'light' ? agThemeLight : agThemeDark);

export const defaultColDef = {
  resizable: true,
  sortable: true,
  suppressMovable: true,
  filter: 'agTextColumnFilter',
  filterParams: { buttons: ['reset'], debounceMs: 200 },
};

const stamp = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Column ids beginning with "__" are action/interactive columns — never exported.
const exportableCols = (api) =>
  api.getAllDisplayedColumns().filter((c) => !c.getColId().startsWith('__'));

export function exportCsv(api, base) {
  if (!api || api.getDisplayedRowCount() === 0) return 0;
  api.exportDataAsCsv({
    fileName: `${base}-${stamp()}.csv`,
    columnKeys: exportableCols(api).map((c) => c.getColId()),
  });
  return api.getDisplayedRowCount();
}

export async function exportExcel(api, base) {
  if (!api || api.getDisplayedRowCount() === 0) return 0;
  const cols = exportableCols(api);
  const headers = cols.map((c) => c.getColDef().headerName || c.getColId());
  const rows = [];
  api.forEachNodeAfterFilterAndSort((node) => {
    const row = {};
    cols.forEach((c, i) => {
      const v = api.getValue(c, node);
      row[headers[i]] = v === null || v === undefined ? '' : v;
    });
    rows.push(row);
  });
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Manager View');
  XLSX.writeFile(wb, `${base}-${stamp()}.xlsx`);
  return rows.length;
}
