import { Upload, FileSpreadsheet, ListOrdered, Phone, Trash2 } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import { useMemo, useRef, useState, useEffect, memo, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  useUploadExcelLeadsMutation,
  useGetLeadsQuery,
  useGetLogDataQuery,
  useDialNextMutation,
  useCallHangupMutation,
  useGetCampaignsQuery,
  useDeleteLeadMutation,
} from "../services/dashboardApi";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";
import { useToast } from "../customHooks/useToast";
import DatePicker from "react-datepicker";
import ConfirmDeletePopup from "../components/ConfimDeletePopup";

ModuleRegistry.registerModules([AllCommunityModule]);

const CallCellRenderer = memo((props) => {
  const number = props.data?.phone_number;
  const { activeNumber, handleRowCall } = props.context || {};

  const isActive = activeNumber === number;
  const isDisabled = !!activeNumber && !isActive;

  return (
    <button
      disabled={isDisabled}
      onClick={() => handleRowCall(number)}
      className={`px-2 py-1 rounded flex items-center gap-1 text-xs
        ${isActive ? "bg-red-600/20 text-red-400" : "bg-green-600/20 text-green-400"}
        ${isDisabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-80"}
      `}
    >
      <Phone size={14} />
      {isActive ? "Disconnect" : "Call"}
    </button>
  );
});

const DeleteCellRenderer = memo((props) => {
  const { onDeleteLead, deletingId } = props.context || {};
  const phone = props.data?.phone_number;

  const isDeleting = deletingId === phone;

  return (
    <button
      onClick={() => onDeleteLead(props.data)}
      disabled={isDeleting}
      className={`px-2 py-1 rounded flex items-center gap-1 text-xs
        bg-rose-600/20 text-rose-300 hover:opacity-80
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      title="Delete lead"
    >
      <Trash2 size={14} />
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
});

export default function LeadsUploadPage() {
  const fileInputRef = useRef(null);
  const gridRef = useRef(null);

  const [file, setFile] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [activeNumber, setActiveNumber] = useState(null);
  const [polling, setPolling] = useState(false);
const [demoData, setDemoData] = useState([]);
const [demoCols, setDemoCols] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null); // single delete row object
  const [deletingId, setDeletingId] = useState(null); // phone_number (single)

  // ✅ multi select state
  const [selectedLeads, setSelectedLeads] = useState([]); // selected row objects
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"))?.user;

  const [dialNext] = useDialNextMutation();
  const [callHangup] = useCallHangupMutation();
  const [deleteLead] = useDeleteLeadMutation();
  const [uploadExcel, { isLoading: uploading }] = useUploadExcelLeadsMutation();

  const { success, error, info } = useToast();
  const today = new Date();

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const { data: logData } = useGetLogDataQuery(user, {
    skip: !polling,
    pollingInterval: 5000,
  });

  const { data: campaingList, isLoading: campaingListLoading } = useGetCampaignsQuery();

  const { data, isFetching } = useGetLeadsQuery(
    {
      sd: startDate.toISOString().split("T")[0],
      ed: endDate.toISOString().split("T")[0],
      limit: pageSize,
    },
    {
      pollingInterval: 30000,
      skipPollingIfUnfocused: true,
    }
  );

  const rowData = data?.leads || [];
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
      const res = await fetch("/sample-leads.xlsx"); // 👈 your file in public
      const blob = await res.blob();

      const reader = new FileReader();

      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);

        if (!json.length) return;

        // create columns dynamically
        const cols = Object.keys(json[0]).map((key) => ({
          headerName: key.toUpperCase(),
          field: key,
        }));

        setDemoData(json.slice(0, 5)); // 👈 only show 5 rows (clean UI)
        setDemoCols(cols);
      };

      reader.readAsArrayBuffer(blob);
    } catch (err) {
      console.error("Failed to load demo excel:", err);
    }
  };

  loadDemoFile();
}, []);
  const onUpload = async () => {
    if (!file || !selectedCampaign) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("campaign_id", String(selectedCampaign.id));
    formData.append("campaign_name", selectedCampaign.name);

    try {
      const res = await uploadExcel(formData).unwrap();

      const skipped = Array.isArray(res?.skipped_details) ? res.skipped_details : [];
      const listCampaignIssues = Array.isArray(res?.list_and_campaign) ? res.list_and_campaign : [];

      // 1) Nice summary toast
      const summary = `Total: ${res?.total_rows ?? "—"} | Success: ${res?.success ?? 0} | Failed: ${
        res?.failed ?? 0
      } | Skipped: ${res?.skipped ?? 0}`;
      success(`Upload completed. ${summary}`);

      // 2) Skipped details (capped)
      const MAX_TOASTS = 8;
      skipped.slice(0, MAX_TOASTS).forEach(({ phone, reason }) => {
        info(`Skipped: ${phone} — ${reason}`);
      });
      if (skipped.length > MAX_TOASTS) {
        info(`+${skipped.length - MAX_TOASTS} more skipped rows...`);
      }

      // 3) list_and_campaign issues (grouped)
      if (listCampaignIssues.length) {
        const grouped = listCampaignIssues.reduce((acc, item) => {
          const reason = item?.reason ?? "Unknown reason";
          if (!acc[reason]) acc[reason] = [];
          acc[reason].push(item);
          return acc;
        }, {});

        Object.entries(grouped).forEach(([reason, items]) => {
          const rows = items
            .map((x) => Number(x.row))
            .filter((n) => Number.isFinite(n))
            .sort((a, b) => a - b);

          const lists = [...new Set(items.map((x) => String(x.list_id)).filter(Boolean))];

          const rowText =
            rows.length === 0
              ? `${items.length} rows`
              : rows.length === 1
              ? `Row ${rows[0]}`
              : `Rows ${rows[0]}–${rows[rows.length - 1]} (${rows.length})`;

          const listText = lists.length ? `List: ${lists.join(", ")}` : "";
          error(`⚠️ ${reason} • ${rowText}${listText ? ` • ${listText}` : ""}`);
        });
      }

      // 4) Clean success if nothing else
      if (!skipped.length && !listCampaignIssues.length) {
        success("Leads uploaded successfully!");
      }

      setFile(null);
      setSelectedCampaign(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
    } catch (err) {
      error("Upload failed, please try again.");
    }
  };

  const StatusRenderer = (params) => {
    const status = params.value;

    const base = "px-2 py-1 rounded text-xs font-semibold whitespace-nowrap";

    const classes = {
      READY: "bg-emerald-500/25 text-emerald-300",
      INCALL: "bg-blue-500/20 text-blue-400",
      PAUSED: "bg-amber-500/20 text-amber-400",
      OFFLINE: "bg-slate-500/20 text-slate-400",
    };

    return (
      <span className={`${base} ${classes[status] || "bg-slate-600/20 text-slate-300"}`}>
        {status}
      </span>
    );
  };

  const handleRowCall = useCallback(
    async (number) => {
      if (activeNumber && activeNumber !== number) return;

      // DISCONNECT
      if (activeNumber === number) {
        try {
          await callHangup().unwrap?.(); // if your mutation supports unwrap
        } catch (e) {
          // fallback if unwrap not present
          try {
            await callHangup();
          } catch {
            error("Failed to Disconnect Call");
            return;
          }
        }

        success("Call Disconnected");
        setActiveNumber(null);
        return;
      }

      try {
        const res = await dialNext(number).unwrap();

        if (res?.vicidial_response?.toLowerCase().includes("error")) {
          error(res.vicidial_response);
          return;
        }
        success("Call Connected");
        setActiveNumber(number);
        setPolling(true);
      } catch (err) {
        console.error("Call failed:", err);
        error("Call failed");
      }
    },
    [activeNumber, dialNext, success, error, callHangup]
  );

  useEffect(() => {
    if (logData?.inCall) return;
    if (!polling) return; // avoid opening dispo on initial mount
    setPolling(false);
    setActiveNumber(null);
  }, [logData, polling]);

  const onDeleteLead = useCallback(
    (lead) => {
      // optional safety: don't allow delete while call active on same number
      if (activeNumber && lead?.phone_number === activeNumber) {
        error("Cannot delete lead while call is active");
        return;
      }
      setDeleteTarget(lead);
    },
    [activeNumber, error]
  );

  const handleConfirmDelete = useCallback(async () => {
    const phone = deleteTarget?.phone_number;
    if (!phone) return;

    try {
      setDeletingId(phone);
      await deleteLead([phone]).unwrap();
      success(`Lead ${phone} deleted`);
      setDeleteTarget(null);
    } catch (e) {
      error("Failed to delete lead");
    } finally {
      setDeletingId(null);
    }
  }, [deleteTarget, deleteLead, success, error]);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (!selectedPhones.length) return;

    try {
      setBulkDeleting(true);

      await deleteLead(selectedPhones).unwrap(); // ✅ array of phones
      success(`Deleted ${selectedPhones.length} lead(s)`);
      setBulkDeleteOpen(false);

      setBulkDeleteOpen(false);
      clearSelection();
    } catch (e) {
      error("Bulk delete failed");
    } finally {
      setBulkDeleting(false);
    }
  }, [selectedPhones, deleteLead, success, error, clearSelection]);

  const columnDefs = useMemo(
    () => [
      // ✅ checkbox selection column
      {
        headerName: "",
        colId: "select",
        width: 52,
        maxWidth: 52,
        pinned: "left",
        lockPinned: true,
        suppressMovable: true,
        sortable: false,
        filter: false,
        checkboxSelection: (p) => !activeNumber, // optional: disable selection while call active
        headerCheckboxSelection: () => !activeNumber,
        headerCheckboxSelectionFilteredOnly: true,
      },

      {
        headerName: "LEAD ID",
        field: "lead_id",
        minWidth: 100,
        maxWidth: 110,
        cellClass: "font-mono text-slate-300",
      },
      {
        headerName: "PHONE",
        field: "phone_number",
        minWidth: 150,
        cellClass: "font-mono text-slate-300",
        filter: true,
      },
      {
        headerName: "USER",
        field: "user",
        minWidth: 140,
        valueFormatter: ({ value }) => value || "—",
      },
      {
        headerName: "FIRST NAME",
        field: "first_name",
        minWidth: 140,
        valueFormatter: ({ value }) => value || "—",
      },
      {
        headerName: "LAST NAME",
        field: "last_name",
        minWidth: 140,
        valueFormatter: ({ value }) => value || "—",
      },
      {
        headerName: "STATUS",
        field: "status",
        minWidth: 110,
        cellRenderer: StatusRenderer,
      },
      {
        headerName: "LIST ID",
        field: "list_id",
        minWidth: 90,
        maxWidth: 100,
        cellClass: "font-mono text-slate-300",
      },
      {
        headerName: "CAMPAIGN",
        field: "campaign_id",
        minWidth: 130,
        cellClass: "font-mono text-slate-300",
        filter: true
      },
      {
        headerName: "ENTRY DATE",
        field: "entry_date",
        minWidth: 130,
        valueFormatter: ({ value }) => (value ? new Date(value).toLocaleDateString() : "—"),
      },

      // (optional) call column (you had it commented)
      // {
      //   headerName: "CALL",
      //   colId: "call",
      //   minWidth: 120,
      //   maxWidth: 130,
      //   pinned: "right",
      //   lockPinned: true,
      //   suppressMovable: true,
      //   cellRenderer: CallCellRenderer,
      // },

      {
        headerName: "DELETE",
        colId: "delete",
        minWidth: 120,
        maxWidth: 130,
        pinned: "right",
        lockPinned: true,
        suppressMovable: true,
        sortable: false,
        filter: false,
        cellRenderer: DeleteCellRenderer,
      },
    ],
    [activeNumber]
  );

  const gridContext = useMemo(
    () => ({
      activeNumber,
      handleRowCall,
      onDeleteLead,
      deletingId,
    }),
    [activeNumber, handleRowCall, onDeleteLead, deletingId]
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: false,
      sortable: true,
      filter: true,
      suppressMovable: false,
      cellClass: "font-mono text-slate-300",
    }),
    []
  );

  const agTheme = useMemo(
    () =>
      themeQuartz.withParams({
        backgroundColor: "rgba(2,6,23,0.45)",
        headerBackgroundColor: "rgba(2,6,23,0.6)",
        headerTextColor: "#94a3b8",
        foregroundColor: "#cbd5f5",
        borderColor: "rgba(30,41,59,0.4)",
        rowHoverColor: "rgba(30,41,59,0.4)",
        oddRowBackgroundColor: "rgba(2,6,23,0.45)",
        headerHeight: 36,
        rowHeight: 34,
      }),
    []
  );

  const rowClassRules = useMemo(
    () => ({
      "active-call-row": (params) => params.data?.phone_number === activeNumber,
    }),
    [activeNumber]
  );

  return (
    <div className="p-4 space-y-6">
      {/* Upload Section */}
      <div className="border border-border rounded-xl bg-card/60 p-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          Upload Leads (Excel)
        </h3>

        <div className="flex flex-wrap items-center justify-end gap-4 ">
          <div className="flex flex-wrap items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={(e) => setFile(e.target.files[0])}
            />

            <button
              onClick={() => fileInputRef.current.click()}
              className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm border border-slate-700"
            >
              Choose File
            </button>

            <span className="text-sm text-slate-400">{file ? file.name : "No file selected"}</span>
          </div>

          <select
            disabled={campaingListLoading || (campaingList?.data?.length ?? 0) === 0}
            value={selectedCampaign?.id ?? ""}
            onChange={(e) => {
              const id = e.target.value;
              const c = campaingList?.data?.find((x) => x.campaign_id === id);
              setSelectedCampaign(c ? { id: c.campaign_id, name: c.campaign_name } : null);
            }}
            className="px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-sm disabled:opacity-50"
          >
            <option value="" disabled>
              {campaingListLoading ? "Loading campaigns..." : "Select Campaign"}
            </option>

            {campaingList?.data?.map((c) => (
              <option key={c.campaign_id} value={c.campaign_id}>
                {c.campaign_name}
              </option>
            ))}
          </select>

          <button
            onClick={onUpload}
            disabled={!file || !selectedCampaign || uploading}
            className="px-5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
      {/* Demo Excel Preview */}
<div className="border border-border rounded-xl bg-card/60 p-4">
  <div className="flex justify-between items-center mb-2">
    <h3 className="text-md font-semibold text-white flex items-center gap-2">
      <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
      Sample Excel Format <p className="text-xs text-amber-400 ">
  ⚠️ Make sure column names match exactly or upload will fail.
</p>
    </h3>

    {/* Download button */}
    <a
      href="/sample-leads.xlsx"
      download
      className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center gap-2"
    >
      <FileSpreadsheet className="w-3 h-3" />
      Download
    </a>
  </div>

  <p className="text-xs text-slate-400 mb-3">
    Upload your Excel file using this structure. Only few sample rows are shown.
  </p>

  <div className="h-[160px]">
    <AgGridReact
      rowData={demoData}
      columnDefs={demoCols}
      defaultColDef={{
        resizable: true,
        sortable: false,
        filter: false,
      }}
      theme={agTheme}
    />
  </div>
</div>

      {/* Table Section */}
      <div className="border border-border rounded-xl bg-card/60 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
          <h3 className="text-xl flex items-center gap-2 font-semibold text-white">
            <ListOrdered className="w-4 h-4 text-emerald-400" />
            Leads
          </h3>

          {/* Right controls */}
          <div className="flex flex-wrap items-center gap-3 justify-end">
            {/* From */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">From:</span>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                maxDate={endDate || today}
                className="bg-input border border-border text-foreground text-sm rounded px-2 py-1 w-24"
                popperClassName="z-50 dark-datepicker"
              />
            </div>

            {/* To */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">To:</span>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                maxDate={today}
                popperPlacement="bottom-start"
                popperClassName="z-50 dark-datepicker"
                className="bg-input border border-border text-foreground text-sm rounded px-2 py-1 w-24"
              />
            </div>

            {/* Rows */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded px-2 py-1 min-w-[90px]"
              >
                {[10, 25, 50, 100, 200, 500, 1000, 5000].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Bulk delete button */}
            <button
              disabled={!selectedPhones.length || bulkDeleting}
              onClick={() => setBulkDeleteOpen(true)}
              className="px-3 py-2 rounded-md bg-rose-600/20 text-rose-200 border border-rose-700/40
                         hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center gap-2"
              title="Delete selected leads"
            >
              <Trash2 size={16} />
              Delete Selected {selectedPhones.length ? `(${selectedPhones.length})` : ""}
            </button>

            {/* ✅ Clear selection */}
            {selectedPhones.length > 0 && (
              <button
                onClick={clearSelection}
                className="px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 text-sm"
              >
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
            getRowId={(p) => p.data.phone_number}
            context={gridContext}
            suppressRowClickSelection
            suppressCellFocus
            loading={isFetching}
            // ✅ enable multiple row selection
            rowSelection="multiple"
            onSelectionChanged={(e) => {
              const rows = e.api.getSelectedRows();
              setSelectedLeads(rows);
            }}
          />
        </div>
      </div>

      {/* Single delete confirm */}
      <ConfirmDeletePopup
        open={!!deleteTarget}
        title="Delete Lead"
        message={`Are you sure you want to delete lead with phone number ${deleteTarget?.phone_number}?`}
        loading={deletingId === deleteTarget?.phone_number}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* ✅ Bulk delete confirm */}
      <ConfirmDeletePopup
        open={bulkDeleteOpen}
        title="Delete Selected Leads"
        message={`Are you sure you want to delete ${selectedPhones.length} lead(s)?`}
        loading={bulkDeleting}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={handleConfirmBulkDelete}
      />
    </div>
  );
}
