import { FileDown, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import { exportCsv, exportExcel } from './gridConfig';

// Export buttons shared by every manager-view grid. `gridRef` is the AgGridReact ref.
export default function GridToolbar({ gridRef, base, count }) {
  const { success, info, error } = useToast();

  const handleCsv = () => {
    const n = exportCsv(gridRef.current?.api, base);
    if (n) success(`Exported ${n} row(s) to CSV`);
    else info('Nothing to export');
  };

  const handleXlsx = async () => {
    try {
      const n = await exportExcel(gridRef.current?.api, base);
      if (n) success(`Exported ${n} row(s) to Excel`);
      else info('Nothing to export');
    } catch {
      error('Excel export failed');
    }
  };

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-secondary/20">
      <span className="text-xs text-muted-foreground">
        {count} row{count === 1 ? '' : 's'}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={handleCsv}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary text-xs transition-smooth"
        >
          <FileDown className="w-3.5 h-3.5" /> CSV
        </button>
        <button
          onClick={handleXlsx}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary text-xs transition-smooth"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
        </button>
      </div>
    </div>
  );
}
