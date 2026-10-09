import React, { useEffect, useState } from "react";
import { useGetAgentWiseLeadQuery } from "@/services";
import { useDispatch, useSelector } from "react-redux";
import { selectFormNameFilter, setFormNameFilter, setIsAvailableLeads } from "@/features/calls/slices/dialSlice";
import { selectCampaingName } from "@/features/auth/slices/authSlice";
import { SkeletonAvatarRow } from "@/shared/components/ui";


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

// Server time of the last dial, shown on redial rows ("2026-10-07T12:26:18").
function formatCallTime(d) {
  if (!d) return "—";
  const date = new Date(String(d));
  if (Number.isNaN(date.getTime())) return safeText(d);
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// queue_type comes from /clients_for_agent: "new" = never dialled, entered in the
// last 7 days (dialled first); "retry" = this agent's redial queue.
const QUEUE_STYLE = {
  new: {
    row: "border-l-2 border-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20",
    avatar: "bg-emerald-500/25 text-emerald-200",
    badge: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40",
    label: "NEW",
  },
  retry: {
    row: "border-l-2 border-amber-400/60 hover:bg-white/10",
    avatar: "bg-white/10 text-white",
    badge: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30",
    label: "REDIAL",
  },
};

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
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/70 to-slate-950/80 shadow-[0_30px_120px_rgba(0,0,0,0.55)] p-3">
        <SkeletonAvatarRow count={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-3 text-sm text-red-400 animate-fade-in">Failed to load leads</div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10
                 bg-gradient-to-b from-slate-900/70 to-slate-950/80
                 shadow-[0_30px_120px_rgba(0,0,0,0.55)]
                 max-h-[500px] overflow-y-auto transition-smooth"
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

            <div className="flex items-center gap-1.5 text-xs shrink-0">
              <span className="rounded px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300">
                {data?.queue_summary?.new ?? 0} new
              </span>
              <span className="rounded px-1.5 py-0.5 bg-amber-500/15 text-amber-300">
                {data?.queue_summary?.retry ?? 0} redial
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lead rows ── */}
      <div className="relative stagger-children">
        {leads.length === 0 ? (
          <div className="p-4 text-sm text-slate-400 animate-fade-in">No Leads right now.</div>
        ) : (
          leads.map((lead) => {
            const fullName = [
              safeText(lead?.title) !== "—" ? safeText(lead?.title) : null,
              safeText(lead?.first_name) !== "—" ? safeText(lead?.first_name) : null,
              safeText(lead?.last_name) !== "—" ? safeText(lead?.last_name) : null,
            ]
              .filter(Boolean)
              .join(" ");

            const isNew = lead?.queue_type === "new";
            const style = isNew ? QUEUE_STYLE.new : QUEUE_STYLE.retry;

            return (
              <div
                key={lead?.lead_id}
                className={`flex items-center gap-3 px-3 py-2 transition-smooth ${style.row}`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${style.avatar}`}>
                  {initials(lead?.first_name, lead?.last_name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-white">
                      {fullName || "Unknown Lead"}
                    </span>
                    <span className={`shrink-0 rounded px-1.5 py-[1px] text-[10px] font-semibold tracking-wide ${style.badge}`}>
                      {style.label}
                    </span>
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
                  <div className="text-slate-500">
                    {isNew
                      ? `List ${safeText(lead?.list_id)}`
                      : `Called ${formatCallTime(lead?.last_call_date)}`}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
