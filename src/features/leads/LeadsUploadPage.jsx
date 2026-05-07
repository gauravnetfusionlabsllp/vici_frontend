import { Upload, FileSpreadsheet, ListOrdered, Trash2, Download, Loader2 } from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  useUploadExcelLeadsMutation,
  useGetLeadsQuery,
  useGetLogDataQuery,
  useDialNextMutation,
  useCallHangupMutation,
  useGetCampaignsQuery,
  useDeleteLeadMutation,
} from '@/services';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { useToast } from '@/shared/hooks/useToast';
import DatePicker from 'react-datepicker';
import ConfirmDeletePopup from '@/shared/components/ConfirmDeletePopup';
import DeleteCellRenderer from './components/DeleteCellRenderer';
import StatusRenderer from './components/StatusRenderer';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function LeadsUploadPage() {
  const fileInputRef = useRef(null);
  const gridRef      = useRef(null);

  const [file,             setFile]             = useState(null);
  const [pageSize,         setPageSize]         = useState(25);
  const [activeNumber,     setActiveNumber]     = useState(null);
  const [polling,          setPolling]          = useState(false);
  const [demoData,         setDemoData]         = useState([]);
  const [demoCols,         setDemoCols]         = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [deleteTarget,     setDeleteTarget]     = useState(null);
  const [deletingId,       setDeletingId]       = useState(null);
  const [selectedLeads,    setSelectedLeads]    = useState([]);
  const [bulkDeleteOpen,   setBulkDeleteOpen]   = useState(false);
  const [bulkDeleting,     setBulkDeleting]     = useState(false);

  const user = JSON.parse(localStorage.getItem('user'))?.user;

  const [dialNext]                          = useDialNextMutation();
  const [callHangup]                        = useCallHangupMutation();
  const [deleteLead]                        = useDeleteLeadMutation();
  const [uploadExcel, { isLoading: uploading }] = useUploadExcelLeadsMutation();
  const { success, error, info }            = useToast();
  const today = new Date();

  const [startDate, setStartDate] = useState(new Date());
  const [endDate,   setEndDate]   = useState(new Date());

  const { data: logData } = useGetLogDataQuery(user, { skip: !polling, pollingInterval: 5000 });
  const { data: campaingList, isLoading: campaingListLoading } = useGetCampaignsQuery();

  const queryParams = useMemo(() => ({
    sd: startDate.toISOString().split('T')[0],
    ed: endDate.toISOString().split('T')[0],
    limit: pageSize,
  }), [startDate, endDate, pageSize]);

  const { data, isFetching } = useGetLeadsQuery(queryParams, {
    pollingInterval: 30000,
    skipPollingIfUnfocused: true,
    refetchOnMountOrArgChange: true,
  });

  const rowData   = data?.leads || [];
  const totalRows = data?.count || 0;

  const selectedPhones = useMemo(
    () => selectedLeads.map((x) => x?.phone_number).filter(Boolean),
    [selectedLeads]
  );

  const clearSelection = useCallback(() => {
    gridRef.current?.api?.deselectAll();
    setSelectedLeads([]);
  }, []);

  useEffect(() => {
    const loadDemoFile = async () => {
      try {
        const res  = await fetch('/sample-leads.xlsx');
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onload = (e) => {
          const data     = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet    = workbook.Sheets[workbook.SheetNames[0]];
          const json     = XLSX.utils.sheet_to_json(sheet);
          if (!json.length) return;
          setDemoCols(Object.keys(json[0]).map((key) => ({ headerName: key.toUpperCase(), field: key })));
          setDemoData(json.slice(0, 5));
        };
        reader.readAsArrayBuffer(blob);
      } catch (err) {
        console.error('Failed to load demo excel:', err);
      }
    };
    loadDemoFile();
  }, []);

  const onUpload = async () => {
    if (!file || !selectedCampaign) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('campaign_id', String(selectedCampaign.id));
    formData.append('campaign_name', selectedCampaign.name);
    try {
      const res = await uploadExcel(formData).unwrap();
      const skipped           = Array.isArray(res?.skipped_details) ? res.skipped_details : [];
      const listCampaignIssues = Array.isArray(res?.list_and_campaign) ? res.list_and_campaign : [];
      const summary = `Total: ${res?.total_rows ?? '—'} | Success: ${res?.success ?? 0} | Failed: ${res?.failed ?? 0} | Skipped: ${res?.skipped ?? 0}`;
      success(`Upload completed. ${summary}`);
      const MAX_TOASTS = 8;
      skipped.slice(0, MAX_TOASTS).forEach(({ phone, reason }) => info(`Skipped: ${phone} — ${reason}`));
      if (skipped.length > MAX_TOASTS) info(`+${skipped.length - MAX_TOASTS} more skipped rows...`);
      if (listCampaignIssues.length) {
        const grouped = listCampaignIssues.reduce((acc, item) => {
          const reason = item?.reason ?? 'Unknown reason';
          if (!acc[reason]) acc[reason] = [];
          acc[reason].push(item);
          return acc;
        }, {});
        Object.entries(grouped).forEach(([reason, items]) => {
          const rows  = items.map((x) => Number(x.row)).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
          const lists = [...new Set(items.map((x) => String(x.list_id)).filter(Boolean))];
          const rowText  = rows.length === 0 ? `${items.length} rows` : rows.length === 1 ? `Row ${rows[0]}` : `Rows ${rows[0]}–${rows[rows.length - 1]} (${rows.length})`;
          const listText = lists.length ? `List: ${lists.join(', ')}` : '';
          error(`⚠️ ${reason} • ${rowText}${listText ? ` • ${listText}` : ''}`);
        });
      }
      if (!skipped.length && !listCampaignIssues.length) success('Leads uploaded successfully!');
      setFile(null);
      setSelectedCampaign(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
    } catch {
      error('Upload failed, please try again.');
    }
  };

  const handleRowCall = useCallback(async (number) => {
    if (activeNumber && activeNumber !== number) return;
    if (activeNumber === number) {
      try { await callHangup().unwrap?.(); } catch { try { await callHangup(); } catch { error('Failed to Disconnect Call'); return; } }
      success('Call Disconnected');
      setActiveNumber(null);
      return;
    }
    try {
      const res = await dialNext(number).unwrap();
      if (res?.vicidial_response?.toLowerCase().includes('error')) { error(res.vicidial_response); return; }
      success('Call Connected');
      setActiveNumber(number);
      setPolling(true);
    } catch {
      error('Call failed');
    }
  }, [activeNumber, dialNext, success, error, callHangup]);

  useEffect(() => {
    if (logData?.inCall) return;
    if (!polling) return;
    setPolling(false);
    setActiveNumber(null);
  }, [logData, polling]);

  const onDeleteLead = useCallback((lead) => {
    if (activeNumber && lead?.phone_number === activeNumber) { error('Cannot delete lead while call is active'); return; }
    setDeleteTarget(lead);
  }, [activeNumber, error]);

  const handleConfirmDelete = useCallback(async () => {
    const phone = deleteTarget?.phone_number;
    if (!phone) return;
    try {
      setDeletingId(phone);
      await deleteLead([phone]).unwrap();
      success(`Lead ${phone} deleted`);
      setDeleteTarget(null);
    } catch { error('Failed to delete lead'); }
    finally { setDeletingId(null); }
  }, [deleteTarget, deleteLead, success, error]);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (!selectedPhones.length) return;
    try {
      setBulkDeleting(true);
      await deleteLead(selectedPhones).unwrap();
      success(`Deleted ${selectedPhones.length} lead(s)`);
      setBulkDeleteOpen(false);
      clearSelection();
    } catch { error('Bulk delete failed'); }
    finally { setBulkDeleting(false); }
  }, [selectedPhones, deleteLead, success, error, clearSelection]);

  const handleDownloadCsv = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    if (api.getDisplayedRowCount() === 0) {
      info('Nothing to download — current filters return no rows');
      return;
    }
    // Skip the auto-injected checkbox column and the action-only "delete" column
    const columnKeys = api.getAllDisplayedColumns()
      .map((col) => col.getColId())
      .filter((id) => id !== 'delete' && !id.toLowerCase().includes('select'));

    const stamp = new Date().toISOString().split('T')[0];
    api.exportDataAsCsv({
      fileName: `leads-${stamp}.csv`,
      columnKeys,
    });
    success(`Downloaded ${api.getDisplayedRowCount()} lead(s)`);
  }, [success, info]);

  const columnDefs = useMemo(() => [
    { headerName: 'ENTRY DATE', field: 'entry_date', minWidth: 140, valueFormatter: ({ value }) => value ? new Date(value).toLocaleDateString() : '—' },
    { headerName: 'PHONE',      field: 'phone_number', minWidth: 150, cellClass: 'font-mono text-slate-300', filter: true },
    { headerName: 'USER',       field: 'user',         minWidth: 140, valueFormatter: ({ value }) => value || '—' },
    { headerName: 'FIRST NAME', field: 'first_name',   minWidth: 140, valueFormatter: ({ value }) => value || '—', resizable: true },
    { headerName: 'LAST NAME',  field: 'last_name',    minWidth: 140, flex: 1, resizable: true, valueFormatter: ({ value }) => value || '—' },
    { headerName: 'STATUS',     field: 'status',       minWidth: 110, cellRenderer: StatusRenderer },
    { headerName: 'CAMPAIGN',   field: 'campaign_id',  minWidth: 130, cellClass: 'font-mono text-slate-300', filter: true },
    { headerName: 'LIST ID',    field: 'list_id',      minWidth: 90,  maxWidth: 100, cellClass: 'font-mono text-slate-300' },
    { headerName: 'LEAD ID',    field: 'lead_id',      minWidth: 100, maxWidth: 110, cellClass: 'font-mono text-slate-300' },
    { headerName: 'DELETE', colId: 'delete', minWidth: 120, maxWidth: 130, pinned: 'right', lockPinned: true, suppressMovable: true, sortable: false, filter: false, cellRenderer: DeleteCellRenderer },
  ], []);

  const gridContext    = useMemo(() => ({ activeNumber, handleRowCall, onDeleteLead, deletingId }), [activeNumber, handleRowCall, onDeleteLead, deletingId]);
  const rowSelectionConfig = useMemo(() => ({
    mode: 'multiRow',
    checkboxes: true,
    headerCheckbox: true,
    selectAll: 'filtered',
    enableClickSelection: false,
    isRowSelectable: (node) =>
      node.data?.status !== 'INCALL' &&
      node.data?.phone_number !== activeNumber &&
      !!node.data?.phone_number,
  }), [activeNumber]);
  const defaultColDef  = useMemo(() => ({ resizable: false, sortable: true, filter: true, suppressMovable: false, cellClass: 'font-mono text-slate-300' }), []);
  const agTheme        = useMemo(() => themeQuartz.withParams({
    backgroundColor: 'rgba(2,6,23,0.45)', headerBackgroundColor: 'rgba(2,6,23,0.6)',
    headerTextColor: '#94a3b8', foregroundColor: '#cbd5f5', borderColor: 'rgba(30,41,59,0.4)',
    rowHoverColor: 'rgba(30,41,59,0.4)', oddRowBackgroundColor: 'rgba(2,6,23,0.45)',
    headerHeight: 36, rowHeight: 34,
  }), []);
  const rowClassRules  = useMemo(() => ({ 'active-call-row': (params) => params.data?.phone_number === activeNumber }), [activeNumber]);

  return (
    <div className="p-4 space-y-6 stagger-children">
      {/* Upload Section */}
      <div className="border border-border rounded-xl bg-card/60 p-4 flex justify-between items-center transition-smooth">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          Upload Leads (Excel)
        </h3>
        <div className="flex flex-wrap items-center justify-end gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" hidden onChange={(e) => setFile(e.target.files[0])} />
            <button onClick={() => fileInputRef.current.click()} className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm border border-slate-700 transition-smooth active:scale-[0.97]">
              Choose File
            </button>
            <span className="text-sm text-slate-400 animate-fade-in" key={file?.name ?? 'none'}>{file ? file.name : 'No file selected'}</span>
          </div>
          <select
            disabled={campaingListLoading || (campaingList?.data?.length ?? 0) === 0}
            value={selectedCampaign?.id ?? ''}
            onChange={(e) => {
              const id = e.target.value;
              const c  = campaingList?.data?.find((x) => x.campaign_id === id);
              setSelectedCampaign(c ? { id: c.campaign_id, name: c.campaign_name } : null);
            }}
            className="px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-sm disabled:opacity-50 transition-smooth focus:border-primary/60"
          >
            <option value="" disabled>{campaingListLoading ? 'Loading campaigns...' : 'Select Campaign'}</option>
            {campaingList?.data?.map((c) => <option key={c.campaign_id} value={c.campaign_id}>{c.campaign_name}</option>)}
          </select>
          <button onClick={onUpload} disabled={!file || !selectedCampaign || uploading}
            className="px-5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm flex items-center gap-2 disabled:opacity-50 transition-smooth active:scale-[0.97] hover:shadow-[0_8px_24px_-8px_rgba(16,185,129,0.6)]">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>

      {/* Demo Excel Preview */}
      <div className="border border-border rounded-xl bg-card/60 p-4 transition-smooth">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-md font-semibold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            Sample Excel Format
            <p className="text-xs text-amber-400">⚠️ Make sure column names match exactly or upload will fail.</p>
          </h3>
          <a href="/sample-leads.xlsx" download
            className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center gap-2 transition-smooth active:scale-[0.97]">
            <FileSpreadsheet className="w-3 h-3" /> Download
          </a>
        </div>
        <p className="text-xs text-slate-400 mb-3">Upload your Excel file using this structure. Only few sample rows are shown.</p>
        <div className="h-[160px]">
          <AgGridReact rowData={demoData} columnDefs={demoCols} defaultColDef={{ resizable: true, sortable: false, filter: false }} theme={agTheme} />
        </div>
      </div>

      {/* Table Section */}
      <div className="border border-border rounded-xl bg-card/60 p-4 transition-smooth">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
          <h3 className="text-xl flex items-center gap-2 font-semibold text-white">
            <ListOrdered className="w-4 h-4 text-emerald-400" /> Leads
          </h3>
          <div className="flex flex-wrap items-center gap-3 justify-end">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">From:</span>
              <DatePicker selected={startDate} onChange={setStartDate} selectsStart startDate={startDate} endDate={endDate} maxDate={endDate || today}
                className="bg-input border border-border text-foreground text-sm rounded px-2 py-1 w-24" popperClassName="z-50 dark-datepicker" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">To:</span>
              <DatePicker selected={endDate} onChange={setEndDate} selectsEnd startDate={startDate} endDate={endDate} minDate={startDate} maxDate={today}
                popperPlacement="bottom-start" popperClassName="z-50 dark-datepicker"
                className="bg-input border border-border text-foreground text-sm rounded px-2 py-1 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">MaxRows:</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded px-2 py-1 min-w-[90px]">
                {[10, 25, 50, 100, 200, 500, 1000, 5000].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button
              onClick={handleDownloadCsv}
              disabled={isFetching || rowData.length === 0}
              title="Download the currently filtered rows as CSV"
              className="px-3 py-2 rounded-md bg-emerald-600/20 text-emerald-200 border border-emerald-700/40
                hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center gap-2 transition-smooth active:scale-[0.97]"
            >
              <Download size={16} />
              Download CSV
            </button>
            <button
              disabled={!selectedLeads.length || bulkDeleting}
              onClick={() => setBulkDeleteOpen(true)}
              className="px-3 py-2 rounded-md bg-rose-600/20 text-rose-200 border border-rose-700/40
                hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center gap-2 transition-smooth active:scale-[0.97]"
            >
              <Trash2 size={16} />
              Delete Selected {selectedLeads.length ? `(${selectedLeads.length})` : ''}
            </button>
            {selectedLeads.length > 0 && (
              <button onClick={clearSelection} className="px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 text-sm transition-smooth active:scale-[0.97] animate-fade-in">
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="h-[480px]">
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            theme={agTheme}
            rowCount={totalRows}
            rowClassRules={rowClassRules}
            getRowId={(p) => String(p.data.lead_id ?? p.data.phone_number)}
            context={gridContext}
            suppressCellFocus
            loading={isFetching}
            rowSelection={rowSelectionConfig}
            onSelectionChanged={(e) => setSelectedLeads(e.api.getSelectedRows())}
          />
        </div>
      </div>

      <ConfirmDeletePopup
        open={!!deleteTarget}
        title="Delete Lead"
        message={`Are you sure you want to delete lead with phone number ${deleteTarget?.phone_number}?`}
        loading={deletingId === deleteTarget?.phone_number}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
      <ConfirmDeletePopup
        open={bulkDeleteOpen}
        title="Delete Selected Leads"
        message={`Are you sure you want to delete ${selectedLeads.length} lead(s)?`}
        loading={bulkDeleting}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={handleConfirmBulkDelete}
      />
    </div>
  );
}
