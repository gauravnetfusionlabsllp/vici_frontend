import { ShieldCheck } from 'lucide-react';
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";
import { useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetCampaignId, selectCampaignId, setCampaignId } from '../slices/campaignAndUsernameFilterSlice';
import { dashboardApi } from '../services/dashboardApi';

export function CampaignPerformance({ data }) {
  const dispatch = useDispatch();
  const activeCampaignId = useSelector(selectCampaignId);

  const rowData = data?.data || [];

  const handleCampaignClick = useCallback((campaignId) => {
    if (activeCampaignId === campaignId) {
      // clicking same id → deselect/clear
      dispatch(resetCampaignId());
    } else {
      dispatch(setCampaignId(campaignId));
    }
    dispatch(dashboardApi.util.invalidateTags(["CAMPAIGN_FILTERED"]));
  }, [dispatch, activeCampaignId]);

  const CampaignIdRenderer = useCallback((params) => {
    const id = params.value;
    const isActive = id === activeCampaignId;

    return (
      <span
        onClick={() => handleCampaignClick(id)}
        className={`
          cursor-pointer font-mono text-xs px-2 py-0.5 rounded transition-all
          ${isActive
            ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50"
            : "text-slate-300 hover:text-emerald-400 hover:underline"
          }
        `}
        title={isActive ? "Click to deselect" : "Click to filter by this campaign"}
      >
        {isActive && <span className="mr-1">▶</span>}
        {id}
      </span>
    );
  }, [activeCampaignId, handleCampaignClick]);

  const StatusRenderer = (params) => {
    const status = params.value;
    const statusClasses = {
      READY: "bg-emerald-500/20 text-emerald-400",
      INCALL: "bg-blue-500/20 text-blue-400",
      PAUSED: "bg-amber-500/20 text-amber-400",
      OFFLINE: "bg-slate-500/20 text-slate-400",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${statusClasses[status] || "bg-slate-600/20 text-slate-300"}`}>
        {status}
      </span>
    );
  };

  const columnDefs = useMemo(
    () => [
      {
        headerName: "CAMPAIGN ID",
        field: "campaign_id",
        minWidth: 120,
        maxWidth: 130,
        cellRenderer: CampaignIdRenderer, // 👈 replaced cellClass with renderer
      },
      {
        headerName: "TOTAL DIALS",
        field: "total_dials",
        minWidth: 110,
        maxWidth: 120,
        cellClass: "font-mono text-slate-300",
      },
      {
        headerName: "CONNECTED CALLS",
        field: "connected_calls",
        minWidth: 150,
        maxWidth: 160,
        cellRenderer: StatusRenderer,
      },
      {
        headerName: "CONNECTION RATE(%)",
        field: "connection_rate_pct",
        minWidth: 170,
        maxWidth: 190,
        cellClass: "font-mono text-slate-300",
      },
      {
        headerName: "TOTAL TALK TIME",
        field: "total_talk_time",
        minWidth: 150,
        maxWidth: 160,
        cellClass: "font-mono text-slate-300",
      },
      {
        headerName: "AVG TALK TIME",
        field: "avg_talk_time",
        minWidth: 140,
        maxWidth: 140,
        hide: true,
        cellClass: "font-mono text-slate-300",
      },
      {
        headerName: "DROP RATE(%)",
        field: "drop_rate_pct",
        minWidth: 140,
        maxWidth: 160,
        cellClass: "font-mono text-slate-300",
      },
      {
        headerName: "CONVERSIONS",
        field: "conversions",
        minWidth: 130,
        flex: 1,
        cellClass: "font-mono text-slate-300",
      }
    ],
    [CampaignIdRenderer] // 👈 depends on CampaignIdRenderer so active state updates
  );

  const defaultColDef = useMemo(() => ({
    sortable: false,
    filter: false,
    resizable: false,
    suppressMovable: true,
  }), []);

  const agTheme = useMemo(() =>
    themeQuartz.withParams({
      backgroundColor: "transparent",
      headerBackgroundColor: "rgba(2,6,23,0.5)",
      headerTextColor: "#94a3b8",
      foregroundColor: "#cbd5f5",
      borderColor: "rgba(30,41,59,0.4)",
      rowHoverColor: "rgba(30,41,59,0.4)",
      oddRowBackgroundColor: "rgba(2,6,23,0.5)",
      headerHeight: 36,
      rowHeight: 34,
      wrapperBorderRadius: 0,
    }), []
  );

  return (
    <div className="p-2 border border-border rounded-lg bg-card/60">
      <div className="flex justify-between items-center m-2 lg:mb-4">
        <h3 className="text-xl leading-[1rem] font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Campaign Performance
        </h3>

        {/* Active filter pill */}
        {activeCampaignId && (
          <div className="flex items-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-1 rounded-full">
            <span>Filtered: <strong>{activeCampaignId}</strong></span>
            <button
              onClick={() => {
                dispatch(resetCampaignId());
                dispatch(dashboardApi.util.invalidateTags(["CAMPAIGN_FILTERED"]));
              }}
              className="hover:text-white transition-colors ml-1"
              title="Clear filter"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="h-[200px] border border-border rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          theme={agTheme}
          suppressRowClickSelection
          suppressCellFocus
          domLayout="normal"
        />
      </div>
    </div>
  );
}