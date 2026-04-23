import React, { useEffect, useState } from "react";
import { useGetAgentWiseLeadQuery } from "../services/dashboardApi";
import { useDispatch, useSelector } from "react-redux";
import { selectFormNameFilter, setFormNameFilter, setIsAvailableLeads } from "../slices/dialSlice";
import { selectCampaingName } from "../slices/authSlice";


function safeText(v) {
  if (v === null || v === undefined) return "—";
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "nan") return "—";
  return s;
}

function initials(first, last) {
  const f = safeText(first);
  const l = safeText(last);
  const a = f !== "—" ? f[0] : "";
  const b = l !== "—" ? l[0] : "";
  const out = (a + b).toUpperCase();
  return out || "??";
}

function formatDate(d) {
  if (!d) return "—";
  const s = String(d);
  const date = new Date(s.includes("T") ? s : `${s}T00:00:00`);
  if (Number.isNaN(date.getTime())) return safeText(d);
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const HOT_METAL_CAMPAIGN = "HotMetaleads";

export default function AgentLeadsPanel() {
  const campaignName = useSelector(selectCampaingName);
  const isHotMetal = campaignName === HOT_METAL_CAMPAIGN;

  const selectedFormName = useSelector(selectFormNameFilter);
 

  // Build query arg — only pass form_name when a value is selected
  const queryArg = isHotMetal && selectedFormName
    ? { form_name: selectedFormName }
    : undefined;

  const { data, isLoading, isError } = useGetAgentWiseLeadQuery(queryArg, {
    pollingInterval: 5000,
    skipPollingIfUnfocused: true,
  });

  const dispatch = useDispatch();
  const leads = data?.data ?? [];

  // Derive unique last names from the FULL (unfiltered) list so the dropdown
  // always shows all options regardless of the current selection.
  // If you'd rather derive them from the current `leads`, just swap the source.
  const uniqueLastNames = React.useMemo(() => {
    const names = leads
      .map((l) => safeText(l?.last_name))
      .filter((n) => n !== "—");
    return [...new Set(names)].sort();
  }, [leads]);

  useEffect(() => {
    dispatch(setIsAvailableLeads(leads.length > 0));
  }, [leads.length, dispatch]);

  // Reset selection when campaign changes away from hotMetaleads
  useEffect(() => {
    if (!isHotMetal) dispatch(setFormNameFilter(""));
  }, [isHotMetal,dispatch]);

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-3 text-sm text-red-400">Failed to load leads</div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10
                 bg-gradient-to-b from-slate-900/70 to-slate-950/80
                 shadow-[0_30px_120px_rgba(0,0,0,0.55)]
                 max-h-[500px] overflow-y-auto"
    >
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(700px_circle_at_15%_0%,rgba(56,189,248,0.16),transparent_55%),radial-gradient(700px_circle_at_90%_10%,rgba(168,85,247,0.14),transparent_55%)]" />

      {/* ── Header ── */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/40 backdrop-blur px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-white">Leads</div>

          <div className="flex items-center gap-2">
            {/* Dropdown — only for hotMetaleads campaign */}
            {isHotMetal && (
              <select
                value={selectedFormName}
                onChange={(e) => dispatch(setFormNameFilter(e.target.value))}
                className="
                  rounded-lg border border-white/10 bg-slate-800/70
                  px-2 py-1 text-xs text-slate-200
                  focus:outline-none focus:ring-1 focus:ring-sky-500/60
                  hover:border-white/20 transition-colors
                  max-w-[160px] truncate
                "
              >
                <option value="">All Meta Campaigns</option>
                {uniqueLastNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}

            <div className="text-xs text-slate-400 shrink-0">
              {safeText(data?.total_records)} total
            </div>
          </div>
        </div>
      </div>

      {/* ── Lead rows ── */}
      <div className="relative">
        {leads.length === 0 ? (
          <div className="p-4 text-sm text-slate-400">No Leads right now.</div>
        ) : (
          leads.map((lead) => {
            const fullName = [
              safeText(lead?.title) !== "—" ? safeText(lead?.title) : null,
              safeText(lead?.first_name) !== "—" ? safeText(lead?.first_name) : null,
              safeText(lead?.last_name) !== "—" ? safeText(lead?.last_name) : null,
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div
                key={lead?.lead_id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-white/10"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-semibold text-white">
                  {initials(lead?.first_name, lead?.last_name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">
                    {fullName || "Unknown Lead"}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                    <span>{safeText(lead?.city)}</span>
                    <span className="text-slate-600">•</span>
                    <span>{safeText(lead?.country_code)}</span>
                    <span className="text-slate-600">•</span>
                    <span>ID: {safeText(lead?.lead_id)}</span>
                  </div>
                </div>

                <div className="shrink-0 text-right text-xs text-slate-400">
                  <div>{formatDate(lead?.entry_date)}</div>
                  <div className="text-slate-500">List {safeText(lead?.list_id)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}