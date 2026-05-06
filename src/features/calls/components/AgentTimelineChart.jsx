import React, { useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { useUserTimelineQuery } from "@/services";

function toMs(iso) {
  const d = new Date(iso);
  const t = d.getTime();
  return Number.isNaN(t) ? null : t;
}

function safeText(v) {
  if (v === null || v === undefined) return "—";
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "nan") return "—";
  return s;
}

function durText(ms) {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (hh > 0) return `${hh}h ${mm}m`;
  if (mm > 0) return `${mm}m ${ss}s`;
  return `${ss}s`;
}

export default function UserTimelinePanel() {
  // ✅ stop polling while user is interacting (hover/drag/zoom)
  const [pausePolling, setPausePolling] = useState(false);

  const { data, isLoading, isError } = useUserTimelineQuery(undefined, {
    // pollingInterval: pausePolling ? 0 : 5000,
    // skipPollingIfUnfocused: true,
  });

  const { series, stats } = useMemo(() => {
    const leads = Array.isArray(data?.leads) ? [...data.leads] : [];

    // ✅ your API is not sorted
    leads.sort((a, b) => (toMs(a.first_tick) ?? 0) - (toMs(b.first_tick) ?? 0));

    const active = [];
    const breaks = [];

    let activeMs = 0;
    let breakMs = 0;

    for (let i = 0; i < leads.length; i++) {
      const cur = leads[i];
      const start = toMs(cur.first_tick);
      const end = toMs(cur.last_tick);

      if (start != null && end != null && end >= start) {
        active.push({
          x: "Active",
          y: [start, end],
          meta: { id: cur.id, first_tick: cur.first_tick, last_tick: cur.last_tick },
        });
        activeMs += end - start;
      }

      // Break = gap between sessions
      if (i < leads.length - 1) {
        const next = leads[i + 1];
        const curEnd = toMs(cur.last_tick);
        const nextStart = toMs(next.first_tick);

        if (curEnd != null && nextStart != null && nextStart > curEnd) {
          breaks.push({
            x: "Break",
            y: [curEnd, nextStart],
            meta: { from: cur.last_tick, to: next.first_tick },
          });
          breakMs += nextStart - curEnd;
        }
      }
    }

    return {
      series: [
        { name: "Active", data: active },
        { name: "Break", data: breaks },
      ],
      stats: {
        sessions: active.length,
        activeMs,
        breakMs,
        total: safeText(data?.count),
      },
    };
  }, [data]);

  const options = useMemo(
    () => ({
      chart: {
        type: "rangeBar",
        background: "transparent",
        foreColor: "#e5e7eb",
        animations: { enabled: false }, // ✅ smoother zoom/pan
        zoom: {
          enabled: true,
          type: "x",
          autoScaleYaxis: true,
        },
        toolbar: {
          show: true,
          tools: {
            download: false,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
          },
        },
        events: {
          // ✅ also pause polling during selection/zoom
          selection: () => setPausePolling(true),
          zoomed: () => setPausePolling(true),
          scrolled: () => setPausePolling(true),
          mouseLeave: () => setPausePolling(false),
        },
      },

      theme: { mode: "dark" },

      colors: ["#22c55e", "#f59e0b"],

      plotOptions: {
        bar: {
          horizontal: true,
          rangeBarGroupRows: true,
          barHeight: "70%",
          borderRadius: 6,
        },
      },

      dataLabels: { enabled: false },

      stroke: {
        width: 1,
        colors: ["rgba(255,255,255,0.12)"],
      },

      fill: { opacity: 0.9 },

      xaxis: {
        type: "datetime",
        // ❌ DO NOT set min/max here, it breaks interaction
        labels: { style: { colors: "#cbd5e1", fontSize: "12px" } },
        axisBorder: { color: "rgba(255,255,255,0.12)" },
        axisTicks: { color: "rgba(255,255,255,0.12)" },
      },

      yaxis: {
        labels: { style: { colors: "#e5e7eb", fontSize: "13px" } },
      },

      grid: {
        borderColor: "rgba(255,255,255,0.08)",
        strokeDashArray: 3,
      },

      legend: {
        show: true,
        position: "bottom",
        labels: { colors: "#e5e7eb" },
        markers: { radius: 6 },
      },

      tooltip: {
        theme: "dark",
        custom: ({ seriesIndex, dataPointIndex, w }) => {
          const dp = w.config.series?.[seriesIndex]?.data?.[dataPointIndex];
          if (!dp?.y) return "";
          const [a, b] = dp.y;
          const ms = b - a;

          const title = dp.x;
          const subtitle = title === "Active" ? `Session ID: ${dp?.meta?.id ?? "—"}` : "Paused / idle time";

          return `
            <div style="
              padding:10px 12px;
              font-size:12px;
              background:#020617;
              color:#e5e7eb;
              border:1px solid rgba(255,255,255,0.12);
              border-radius:10px;
              min-width:220px;
            ">
              <div style="font-weight:700; margin-bottom:4px;">${title}</div>
              <div style="color:#94a3b8; margin-bottom:8px;">${subtitle}</div>
              <div><b>From:</b> ${new Date(a).toLocaleString()}</div>
              <div><b>To:</b> ${new Date(b).toLocaleString()}</div>
              <div style="margin-top:6px;"><b>Duration:</b> ${durText(ms)}</div>
            </div>
          `;
        },
      },
    }),
    []
  );

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        <div className="h-10 animate-pulse rounded-xl bg-white/5" />
        <div className="h-64 animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }

  if (isError) {
    return <div className="p-3 text-sm text-red-400">Failed to load user timeline</div>;
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10
                 bg-gradient-to-b from-slate-900/70 to-slate-950/80
                 shadow-[0_30px_120px_rgba(0,0,0,0.55)]
                 max-h-[500px]"
    >
      {/* soft glow (same as your CallbackListPanel) */}
      <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(700px_circle_at_15%_0%,rgba(56,189,248,0.16),transparent_55%),radial-gradient(700px_circle_at_90%_10%,rgba(168,85,247,0.14),transparent_55%)]" />

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/40 backdrop-blur px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Agent Activity Timeline</div>

          <div className="text-xs text-slate-400">
            Sessions: {stats.sessions} • Active: {durText(stats.activeMs)} • Break: {durText(stats.breakMs)}
            {pausePolling && <span className="ml-2 text-slate-500">(interaction)</span>}
          </div>
        </div>
      </div>

      {/* Chart area */}
      <div
        className="relative px-2 py-2 overflow-visible"
        onMouseEnter={() => setPausePolling(true)}
        onMouseLeave={() => setPausePolling(false)}
      >
        {series?.[0]?.data?.length === 0 ? (
          <div className="p-4 text-sm text-slate-400">No activity found.</div>
        ) : (
          <Chart options={options} series={series} type="rangeBar" height={320} />
        )}
      </div>
    </div>
  );
}
