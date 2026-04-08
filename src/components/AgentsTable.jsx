import { Users } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";
import { useCallback, useMemo } from "react";
import { dashboardApi, useGetAgentsProductivityQuery } from "../services/dashboardApi";
import { resetUsername, selectUsername, setUsername } from "../slices/campaignAndUsernameFilterSlice";
import { useDispatch, useSelector } from "react-redux";


ModuleRegistry.registerModules([AllCommunityModule]);

export function AgentsTable() {
  const { data = [] } =
    useGetAgentsProductivityQuery(undefined, {
      pollingInterval: 30000,
      skipPollingIfUnfocused: true,
    });
    const dispatch = useDispatch();
  const rowData = data?.data || [];
  const activeUsername = useSelector(selectUsername);
  const hhmmssToMinutes = (time) => {
    if (!time) return 0;
    const [hh, mm, ss] = time.split(":").map(Number);
    return hh * 60 + mm + ss / 60;
  };
  const StatusRenderer = (params) => {
    const status = params.value ?? "OFFLINE";
    const talkTime = params.data?.TALK_TIME_HH_MM_SS;

    const minutes = hhmmssToMinutes(talkTime);

    let className =
      "px-2 py-1 rounded text-xs font-semibold whitespace-nowrap";

    if (status === "PAUSED") {
      if (minutes < 3) {
        className += " bg-emerald-500/20 text-emerald-400";
      } else if (minutes <= 10) {
        className += " bg-amber-500/20 text-amber-400";
      } else {
        className +=
          " bg-red-500/20 text-red-400 animate-pulse";
      }
    } else {
      const statusClasses = {
        READY: " bg-emerald-500/25 text-emerald-300",
        INCALL: " bg-blue-500/20 text-blue-400",
        OFFLINE: " bg-slate-500/20 text-slate-400",
      };

      className += statusClasses[status] ||
        " bg-slate-600/20 text-slate-300";
    }

    return <span className={className}>{status}</span>;
  };
  const StarRenderer = (params) => {
  const rating = params.value ?? 0;
  const maxStars = 5;

  return (
    <div className="flex items-center gap-[2px]">
      {[...Array(maxStars)].map((_, i) => {
        const fillPercent = Math.min(Math.max(rating - i, 0), 1) * 100;

        return (
          <div key={i} className="relative w-4 h-4">
            {/* Empty star */}
            <svg viewBox="0 0 24 24" className="absolute w-4 h-4 text-gray-400">
              <path
                fill="currentColor"
                d="M12 17.27L18.18 21l-1.64-7.03
                L22 9.24l-7.19-.61L12 2
                9.19 8.63 2 9.24l5.46
                4.73L5.82 21z"
              />
            </svg>

            {/* Filled star (partial) */}
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
};
const handleUsernameClick = useCallback((username) => {
    if (activeUsername === username) {
      // clicking same id → deselect/clear
      dispatch(resetUsername());
    } else {
      dispatch(setUsername(username));
    }
    dispatch(dashboardApi.util.invalidateTags(["USERNAME_FILTERED"]));
  }, [dispatch, activeUsername]);
  const CampaignIdRenderer = useCallback((params) => {
    const selectedUsername = params.value;
    const isActive = selectedUsername === activeUsername;

    return (
      <span
        onClick={() => handleUsernameClick(selectedUsername)}
        className={`
          cursor-pointer font-mono text-xs px-2 py-0.5 rounded transition-all
          ${isActive
            ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50"
            : "text-slate-300 hover:text-emerald-400 hover:underline"
          }
        `}
        title={isActive ? "Click to deselect" : "Click to filter by this username"}
      >
        {isActive && <span className="mr-1">▶</span>}
        {selectedUsername}
      </span>
    );
  }, [activeUsername, handleUsernameClick]);
  const columnDefs = useMemo(
    () => [
      {
        headerName: "STATION",
        field: "STATION",
        minWidth: 100,
        maxWidth: 100,
        cellClass: "font-mono text-slate-300",
      },
      {
        headerName: "USER ID",
        field: "USER_ID",
        minWidth: 100,
        maxWidth: 100,
        cellClass: "font-mono text-slate-300",
        cellRenderer: CampaignIdRenderer,
      },
      {
        headerName: "USER NAME",
        field: "USER_NAME",
        minWidth: 170,
        maxWidth: 180,
        cellClass: "font-mono text-slate-300",
        
      },
      {
        headerName: "STATUS",
        field: "STATUS",
        minWidth: 90,
        maxWidth: 100,
        cellRenderer: StatusRenderer,
      },
      {
        headerName: "STARS",
        field: "avg_stars",
        minWidth: 90,
        maxWidth: 110,
        cellRenderer: StarRenderer,
      },
      {
        headerName: "CALLS",
        field: "CALLS",
        minWidth: 90,
        maxWidth: 90,
        cellClass: "font-mono text-slate-300",
      },
      {
        headerName: "CONNECTED",
        field: "connected_calls",
        minWidth: 120,
        maxWidth: 120,
        cellClass: "font-mono text-slate-300",
      },
      // {
      //   headerName: "PHONE",
      //   field: "phone_number",
      //   minWidth: 140,
      //   maxWidth: 140,
      //   cellClass: "font-mono text-slate-300",
      // },
      {
        headerName: "LOGIN DURATION",
        field: "login_duration",
        minWidth: 150,
        maxWidth: 160,
        cellClass: "font-mono text-slate-300",
      },
      {
        headerName: "TALK TIME",
        field: "TALK_TIME_HH_MM_SS",
        minWidth: 120,
        maxWidth: 160,
        // flex: 1, // ✅ let this stretch
        cellClass: "font-mono text-slate-300",
      },
      {
        headerName: "PAUSE DURATION",
        field: "pause_sec",
        minWidth: 120,
        maxWidth: 160,
        // flex: 1, // ✅ let this stretch
        cellClass: "font-mono text-slate-300",
      },
    ],
    [CampaignIdRenderer]
  );
  const defaultColDef = useMemo(
    () => ({
      sortable: false,
      filter: false,
      resizable: false,
      suppressMovable: true,
    }),
    []
  );

  const agTheme = useMemo(
    () =>
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
      }),
    []
  );

  return (
    <div className="p-2 h-full border border-border rounded-lg bg-card/60">
      {/* Header */}
      <div className="flex justify-between items-center m-2 lg:mb-4">
        <h3 className="text-xl leading-[1rem] font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          Agents Productivity
        </h3>

        {activeUsername && (
                  <div className="flex items-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-1 rounded-full">
                    <span>Filtered: <strong>{activeUsername}</strong></span>
                    <button
                      onClick={() => {
                        dispatch(resetUsername());
                        dispatch(dashboardApi.util.invalidateTags(["USERNAME_FILTERED"]));
                      }}
                      className="hover:text-white transition-colors ml-1"
                      title="Clear filter"
                    >
                      ✕
                    </button>
                  </div>
                )}
      </div>

      {/* Grid */}
      <div className="lg:h-[90%] h-[320px] max-h-full border border-border rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
        <AgGridReact
          // height="90%%"
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
