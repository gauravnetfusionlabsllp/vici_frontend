// src/pages/CampaignLeadsPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin-only: Campaign Lead Distribution Router
// Uses RTK Query hooks from dashboardApi — no local fetch() calls.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Radio,
  Plus,
  RefreshCw,
  Infinity,
  Play,
  Pause,
  ChevronsRight,
  X,
  CalendarRange,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Ban,
  ChevronDown,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useToast } from "../customHooks/useToast";
import {
  useGetCampaignLeadsQuery,
  useCreateCampaignLeadMutation,
  useToggleCampaignLeadActiveMutation,
  useSyncCampaignLeadRuleMutation,
  useGetCampaignsQuery,
  useLeadFiltersQuery,
} from "../services/dashboardApi";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Derives the operational status of a routing rule */
function routeStatus(lead) {
  const now   = new Date();
  const start = new Date(lead.startdate);
  const end   = lead.enddate ? new Date(lead.enddate) : null;
  if (!lead.isactive)           return "paused";
  if (now < start)              return "scheduled";
  if (end && now > end)         return "expired";
  if (!end)                     return "live";   // ← no endDate = eternal realtime
  return "bounded";
}

const STATUS_CFG = {
  live:      { label: "LIVE",      cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400", pulse: true  },
  bounded:   { label: "BOUNDED",   cls: "bg-amber-500/15  text-amber-300  border-amber-500/30",    dot: "bg-amber-400",   pulse: false },
  scheduled: { label: "SCHEDULED", cls: "bg-sky-500/15    text-sky-300    border-sky-500/30",      dot: "bg-sky-400",     pulse: false },
  expired:   { label: "EXPIRED",   cls: "bg-rose-500/15   text-rose-300   border-rose-500/30",     dot: "bg-rose-400",    pulse: false },
  paused:    { label: "PAUSED",    cls: "bg-slate-700/40  text-slate-400  border-slate-600/40",    dot: "bg-slate-500",   pulse: false },
};

function StatusBadge({ status }) {
  const { label, cls, dot, pulse } = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-widest ${cls}`}>
      <span className={`relative flex h-1.5 w-1.5 shrink-0`}>
        {pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dot} opacity-60`} />}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dot}`} />
      </span>
      {label}
    </span>
  );
}

function ConditionChip({ label, value, accent }) {
  if (!value) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] border
      ${accent
        ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
        : "bg-slate-800/60 border-slate-700/50 text-slate-400"
      }`}
    >
      <span className="text-slate-600">{label}</span>
      <span>{value}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD — top summary strip
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="flex-1 min-w-[130px] border border-border rounded-lg bg-card/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
        {Icon && <Icon className={`w-3.5 h-3.5 ${color ?? "text-slate-500"}`} />}
      </div>
      <div className="text-2xl font-bold font-mono text-white">{value ?? "—"}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTING CARD
// ─────────────────────────────────────────────────────────────────────────────
function LeadCard({ lead, onToggle, onSync, toggling }) {
  const status = routeStatus(lead);

  return (
    <div className={`group relative overflow-hidden border rounded-xl
      bg-gradient-to-b from-slate-900/60 to-slate-950/70
      transition-all duration-200
      hover:shadow-[0_8px_32px_rgba(0,0,0,0.55)]
      ${status === "live" ? "border-emerald-500/20 hover:border-emerald-500/40" : "border-white/8 hover:border-white/[0.14]"}
    `}>
      {/* live accent top stripe */}
      {status === "live" && (
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
      )}

      <div className="relative p-4 flex flex-col gap-3">
        {/* Row 1: status + toggle */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={status} />
              <span className="text-[10px] text-slate-600 font-mono">#{lead.id}</span>
            </div>
            <div className="text-sm font-semibold text-slate-100 truncate">{lead.campaign_name}</div>
            <div className="text-[11px] text-slate-500 font-mono truncate">→ {lead.destination_campaign}</div>
          </div>

          <button
            onClick={() => onToggle(lead.id)}
            disabled={toggling}
            title={lead.isactive ? "Pause rule" : "Resume rule"}
            className={`shrink-0 h-8 w-8 grid place-items-center rounded-lg border transition
              ${lead.isactive
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300"
                : "border-slate-600/40 bg-slate-800/40 text-slate-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-300"
              }
              disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {toggling
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : lead.isactive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />
            }
          </button>
        </div>

        {/* Row 2: condition chips */}
        <div className="flex flex-wrap gap-1.5">
          <ConditionChip label="src"  value={lead.source} />
          <ConditionChip label="form" value={lead.form_name} />
          <ConditionChip label="from" value={fmtDate(lead.startdate)} />
          {lead.enddate
            ? <ConditionChip label="until" value={fmtDate(lead.enddate)} />
            : (
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] border
                bg-emerald-500/10 border-emerald-500/25 text-emerald-300">
                <Infinity className="w-2.5 h-2.5" /> realtime · no expiry
              </span>
            )
          }
        </div>

        {/* Row 3: per-rule sync */}
        <button
          onClick={() => onSync(lead)}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-700/60
            py-1.5 text-[11px] text-slate-500 font-medium tracking-wider uppercase
            hover:border-emerald-500/40 hover:text-emerald-400 hover:bg-emerald-500/5
            transition-all duration-150"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
          Sync this rule
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYNC DRAWER — scoped to one rule
// ─────────────────────────────────────────────────────────────────────────────
function SyncDrawer({ lead, onClose }) {
  const { success, error } = useToast();
  const [sd, setSd] = useState(null);
  const [ed, setEd] = useState(null);
  const [syncRule, { isLoading }] = useSyncCampaignLeadRuleMutation();
  const [result, setResult] = useState(null);

  useEffect(() => { setResult(null); setSd(null); setEd(null); }, [lead?.id]);

  if (!lead) return null;

  const toYMD = (d) => {
    if (!d) return undefined;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const handleRun = async () => {
    try {
      const params = {
        source:        lead.source        || undefined,
        form_name:     lead.form_name     || undefined,
        campaign_name: lead.campaign_name || undefined,
        sd: toYMD(sd),
        ed: toYMD(ed),
      };
      // remove undefined keys
      Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
      const res = await syncRule(params).unwrap();
      setResult(res);
      success(`Sync done — ${res.success ?? 0} leads pushed`);
    } catch {
      error("Sync failed — check the console");
    }
  };

  const stats = result
    ? [
        { label: "Total",     v: result.total,       cls: "text-slate-200" },
        { label: "Pushed",    v: result.success,      cls: "text-emerald-400" },
        { label: "Duplicate", v: result.duplicate,    cls: "text-amber-400"  },
        { label: "Skipped",   v: result.skipped,      cls: "text-sky-400"    },
        { label: "Failed",    v: result.failed_count, cls: "text-rose-400"   },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div onClick={onClose} className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
      <aside className="relative z-10 w-[400px] max-w-full h-full bg-gradient-to-b from-slate-900/95 to-slate-950
        border-l border-white/10 flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.7)]
        animate-[slideInRight_0.25s_cubic-bezier(0.22,1,0.36,1)]">

        {/* header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] text-emerald-400 uppercase tracking-widest mb-1">Scoped Sync</div>
            <div className="text-sm font-semibold text-slate-100">{lead.campaign_name}</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <ConditionChip label="src"  value={lead.source} />
              <ConditionChip label="form" value={lead.form_name} />
              <ConditionChip label="→"    value={lead.destination_campaign} />
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white transition shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <p className="text-xs text-slate-500 leading-relaxed">
            Re-processes <span className="text-slate-400">meta_leads</span> matching this rule's conditions exactly.
            Optionally narrow by date range below.
          </p>

          {/* date range */}
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <CalendarRange className="w-3 h-3" /> Date range (optional)
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[["From", sd, setSd], ["To", ed, setEd]].map(([label, val, set]) => (
                <div key={label}>
                  <div className="text-[10px] text-slate-600 mb-1">{label.toUpperCase()}</div>
                  <DatePicker
                    selected={val}
                    onChange={(d) => set(d)}
                    dateFormat="dd MMM yyyy"
                    maxDate={new Date()}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2
                      focus:outline-none focus:ring-1 focus:ring-sky-500/40"
                    popperClassName="z-[60] dark-datepicker"
                    placeholderText="Any date"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* result summary */}
          {result && (
            <div className="rounded-xl border border-white/8 bg-slate-950/50 p-4">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Result</div>
              <div className="grid grid-cols-5 gap-2 text-center">
                {stats.map(({ label, v, cls }) => (
                  <div key={label}>
                    <div className={`text-xl font-bold font-mono ${cls}`}>{v}</div>
                    <div className="text-[9px] text-slate-600 uppercase tracking-wider mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {result.failed?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/6">
                  <div className="text-[10px] text-rose-400 uppercase tracking-widest mb-2">Failed</div>
                  <div className="space-y-1 max-h-28 overflow-y-auto scrollbar-thin">
                    {result.failed.map((f, i) => (
                      <div key={i} className="text-[11px] text-slate-500 font-mono">
                        {f.phone} — <span className="text-rose-400/70">{f.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="px-5 py-4 border-t border-white/10 flex gap-3">
          <button
            onClick={handleRun}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5
              bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold
              disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronsRight className="w-4 h-4" />}
            {isLoading ? "Running…" : "Run Sync"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/8 text-sm transition"
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE RULE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function CreateRuleModal({ open, onClose }) {
  const { success, error } = useToast();
  const [createLead, { isLoading }] = useCreateCampaignLeadMutation();
  const { data: filtersData, isLoading: filtersLoading } = useLeadFiltersQuery();
  const { data: campaignList, isLoading: campaignListLoading } = useGetCampaignsQuery();

  const EMPTY = {
    campaign_name: "", destination_campaign: "",
    source: "", form_name: "",
    startDate: "", endDate: "", isActive: true,
  };
  const [form, setForm] = useState(EMPTY);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => { if (open) setForm(EMPTY); }, [open]);

  if (!open) return null;

  const isValid = form.campaign_name.trim() && form.destination_campaign.trim() && form.startDate && form.source.trim();

  const handleSave = async () => {
    if (!isValid) return;
    try {
      const payload = {
        ...form,
        endDate: form.endDate?.trim() || null,
      };
      await createLead(payload).unwrap();
      success("Routing rule created");
      onClose();
    } catch {
      error("Failed to create rule");
    }
  };

  // Shared dropdown class
 const selectCls = `w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm
  text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition
  [color-scheme:dark] appearance-none cursor-pointer
  disabled:opacity-40 disabled:cursor-not-allowed`;

  // Reusable select wrapper with chevron icon
  const sel = (k, label, options = [], loading = false, placeholder = "Select…", hint = "") => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] text-slate-400 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <select
          value={form[k]}
          onChange={(e) => set(k, e.target.value)}
          disabled={loading}
          className={selectCls}
        >
          <option value="" disabled hidden>
            {loading ? "Loading…" : placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Chevron */}
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          {loading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
            : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          }
        </div>
      </div>
      {hint && <div className="text-[10px] text-slate-600">{hint}</div>}
    </div>
  );

  // Reusable date input (unchanged)
  const inp = (k, label, type = "date", hint = "") => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] text-slate-400 uppercase tracking-widest">{label}</label>
      <input
        type={type} value={form[k]}
        onChange={(e) => set(k, e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200
  placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition
  [color-scheme:dark]"
      />
      {hint && <div className="text-[10px] text-slate-600">{hint}</div>}
    </div>
  );

  // Build option arrays from API responses
  const campaignNameOpts = (filtersData?.campaign_names ?? [])
    .filter(Boolean)
    .map((n) => ({ value: n, label: n }));

  const sourceOpts = (filtersData?.sources ?? [])
    .filter(Boolean)
    .map((s) => ({ value: s, label: s }));

  const formNameOpts = (filtersData?.form_names ?? [])
    .filter(Boolean)
    .map((f) => ({ value: f, label: f }));

  const destinationOpts = (campaignList?.data ?? []).map((c) => ({
    value: c.campaign_id,
    label: `${c.campaign_name} (${c.campaign_id})`,
  }));

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-white/10
          bg-gradient-to-b from-slate-900/90 to-slate-950/95
          shadow-[0_30px_120px_rgba(0,0,0,0.65)] overflow-hidden"
      >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-white/10">
          <div className="absolute inset-0 opacity-50 bg-[radial-gradient(600px_circle_at_20%_0%,rgba(56,189,248,0.12),transparent_50%)]" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="text-[10px] text-sky-400 uppercase tracking-widest mb-1">New Routing Rule</div>
              <h3 className="text-base font-semibold text-slate-100">Create Lead Config</h3>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 grid place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {sel(
              "source",
              "Source *",
              sourceOpts,
              filtersLoading,
              "Select source…"
            )}
            {sel(
              "destination_campaign",
              "Destination *",
              destinationOpts,
              campaignListLoading,
              "Select VICIdial campaign…"
            )}
            
            {sel(
              "campaign_name",
              "Campaign Name *",
              campaignNameOpts,
              filtersLoading,
              "Select campaign…"
            )}
            {sel(
              "form_name",
              "Form Name",
              formNameOpts,
              filtersLoading,
              "Select form…"
            )}
            {inp("startDate", "Start Date *", "date")}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 uppercase tracking-widest">End Date</label>
              <input
                type="date" value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200
                  focus:outline-none focus:ring-2 focus:ring-sky-500/30 [color-scheme:dark]"
              />
              <div className="text-[10px] text-emerald-500/70">leave blank → realtime routing forever</div>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-slate-950/30 px-4 py-3">
            <button
              type="button"
              onClick={() => set("isActive", !form.isActive)}
              className={`relative h-6 w-11 rounded-full border transition
                ${form.isActive ? "bg-emerald-500/30 border-emerald-500/40" : "bg-slate-800/60 border-slate-700"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all shadow
                ${form.isActive ? "left-5" : "left-0.5"}`} />
            </button>
            <div>
              <div className={`text-sm font-medium ${form.isActive ? "text-emerald-300" : "text-slate-400"}`}>
                {form.isActive ? "Active immediately" : "Start paused"}
              </div>
              <div className="text-[10px] text-slate-600">
                {form.isActive ? "Will start routing incoming leads at once" : "Enable manually when ready"}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={!isValid || isLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-sky-600/40 bg-sky-600/20
                px-4 py-2.5 text-sm font-semibold text-sky-100 hover:bg-sky-600/30 transition disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Rule
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/8 text-sm transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING / EMPTY / ERROR STATES
// ─────────────────────────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-44 animate-pulse rounded-xl bg-white/5 border border-white/8" />
      ))}
    </div>
  );
}

function EmptyState({ onNew }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <div className="h-14 w-14 rounded-xl border border-white/10 bg-slate-800/60 grid place-items-center">
        <Radio className="w-6 h-6 text-slate-600" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-400">No routing rules yet</p>
        <p className="text-xs text-slate-600 mt-1">Create your first rule to start distributing leads automatically</p>
      </div>
      <button onClick={onNew} className="flex items-center gap-2 rounded-lg border border-sky-600/40 bg-sky-600/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-600/30 transition">
        <Plus className="w-4 h-4" /> Create Rule
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER TABS
// ─────────────────────────────────────────────────────────────────────────────
const FILTERS = [
  { key: "all",       label: "All"       },
  { key: "live",      label: "Live"      },
  { key: "bounded",   label: "Bounded"   },
  { key: "scheduled", label: "Scheduled" },
  { key: "paused",    label: "Paused"    },
  { key: "expired",   label: "Expired"   },
];

// ─────────────────────────────────────────────────────────────────────────────
// PAGE ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function CampaignLeadsPage() {
  const { success, error } = useToast();

  const {
    data: leads = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetCampaignLeadsQuery(undefined, {
    pollingInterval: 30000,
    skipPollingIfUnfocused: true,
  });

  const [toggleActive, { originalArgs: togglingId }] = useToggleCampaignLeadActiveMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [syncLead,   setSyncLead]   = useState(null);
  const [filter,     setFilter]     = useState("all");

  const handleToggle = useCallback(async (id) => {
    try {
      const res = await toggleActive(id).unwrap();
      success(`Rule #${id} ${res.isActive ? "resumed" : "paused"}`);
    } catch {
      error("Failed to toggle rule status");
    }
  }, [toggleActive, success, error]);

  // Derived counts for filter tabs + summary
  const counts = FILTERS.reduce((acc, { key }) => {
    acc[key] = key === "all" ? leads.length : leads.filter((l) => routeStatus(l) === key).length;
    return acc;
  }, {});

  const liveCount      = counts.live;
  const realtimeCount  = leads.filter((l) => routeStatus(l) === "live" && !l.enddate).length;

  const visible = filter === "all" ? leads : leads.filter((l) => routeStatus(l) === filter);

  return (
    <div className="min-h-screen p-4 md:p-6 bg-[hsl(231_58%_6%)] text-white">
      <div className="mx-auto max-w-[1440px] space-y-5">

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10
          bg-gradient-to-b from-slate-900/70 to-slate-950/80
          shadow-[0_30px_120px_rgba(0,0,0,0.55)] px-5 py-5">
          <div className="pointer-events-none absolute inset-0 opacity-60
            bg-[radial-gradient(700px_circle_at_0%_0%,rgba(16,185,129,0.10),transparent_55%),
               radial-gradient(600px_circle_at_100%_100%,rgba(56,189,248,0.08),transparent_55%)]" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl border border-emerald-400/20 bg-emerald-500/10 grid place-items-center shrink-0">
                <Radio className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-100 leading-none">Lead Distribution Router</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Rules match incoming meta_leads by source · form · campaign and route them to VICIdial in realtime
                </p>
              </div>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-sky-600/40 bg-sky-600/20 px-3 py-2
                text-sm font-semibold text-sky-200 hover:bg-sky-600/30 transition"
            >
              <Plus className="w-4 h-4" /> New Rule
            </button>
          </div>
        </div>

        {/* ── Summary stat strip ──────────────────────────────────── */}
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
          <StatCard label="Total Rules"    value={leads.length} sub="configured"           icon={Radio}        color="text-slate-400" />
          <StatCard label="Live Now"       value={liveCount}    sub="routing incoming"      icon={CheckCircle2} color="text-emerald-400" />
          <StatCard label="Realtime ∞"     value={realtimeCount} sub="no expiry set"        icon={Infinity}     color="text-sky-400" />
          <StatCard label="Scheduled"      value={counts.scheduled} sub="not started yet"   icon={Clock3}       color="text-amber-400" />
          <StatCard label="Paused"         value={counts.paused}    sub="manually stopped"  icon={Pause}        color="text-slate-500" />
          <StatCard label="Expired"        value={counts.expired}   sub="past end date"     icon={Ban}          color="text-rose-400" />
        </div>

        {/* ── Main card ───────────────────────────────────────────── */}
        <div className="border border-border rounded-xl bg-card/60 p-4 md:p-5">

          {/* toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            {/* filter tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition
                    ${filter === key
                      ? "border-sky-500/40 bg-sky-500/15 text-sky-200"
                      : "border-white/8 bg-white/[0.03] text-slate-400 hover:text-slate-200 hover:bg-white/6"
                    }`}
                >
                  {label}
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold
                    ${filter === key ? "bg-sky-500/30 text-sky-200" : "bg-white/8 text-slate-500"}`}>
                    {counts[key]}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {isFetching && !isLoading && (
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> syncing
                </span>
              )}
              <button
                onClick={refetch}
                disabled={isFetching}
                className="h-8 w-8 grid place-items-center rounded-lg border border-white/10 bg-white/5
                  text-slate-400 hover:text-slate-200 hover:bg-white/8 transition disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* content */}
          {isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-rose-400">
              <AlertTriangle className="w-8 h-8" />
              <p className="text-sm">Failed to load routing rules</p>
              <button onClick={refetch} className="text-xs underline text-rose-300">Retry</button>
            </div>
          ) : isLoading ? (
            <LoadingSkeleton />
          ) : visible.length === 0 && filter === "all" ? (
            <EmptyState onNew={() => setCreateOpen(true)} />
          ) : visible.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No {filter} rules right now
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
              {visible.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onToggle={handleToggle}
                  onSync={setSyncLead}
                  toggling={togglingId === lead.id}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modals / Drawers */}
      <CreateRuleModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <SyncDrawer lead={syncLead} onClose={() => setSyncLead(null)} />

      {/* keyframe for drawer slide-in */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}