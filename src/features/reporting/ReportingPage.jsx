import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Flame, Loader2, RefreshCw, Search, AlertTriangle, Columns3, Sun, Moon } from 'lucide-react';

import { selectIsAdmin, selectUser } from '@/features/auth/slices/authSlice';
import { useGetHotMetaLeadsQuery, useGetHotMetaLeadNotesMappingQuery } from '@/services';
import { SkeletonTable } from '@/shared/components/ui';

import { STRINGEE, stringeeGradient } from '@/shared/lib/stringeeBrand';
import { DISPOSITIONS } from '@/features/leads/constants';

import HotLeadsGrid from './components/HotLeadsGrid';
import ManageCustomColumnsModal from './components/ManageCustomColumnsModal';
import LeadDetailModal from './components/LeadDetailModal';

// Page-scoped light/dark theme, persisted independently from other pages. Defaults to dark
// (the app-wide look); the header toggle exposes the light "spreadsheet" theme.
const RV_THEME_KEY = 'rv-theme';
function readInitialTheme() {
  try {
    const v = localStorage.getItem(RV_THEME_KEY);
    return v === 'light' || v === 'dark' ? v : 'dark';
  } catch {
    return 'dark';
  }
}

// Stable identities so `?? fallback` doesn't hand useMemo a new object each render.
const EMPTY_ROWS = [];
const EMPTY_TOTALS = { total: null, stringee: null };

const ALL_STATUSES = '__all__';
const NO_STATUS = '__none__';
const statusCode = (r) => (r.vici_call_status ?? '').toString().trim().toUpperCase() || NO_STATUS;

export default function ReportingPage() {
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);

  const {
    data: hotLeads,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetHotMetaLeadsQuery(undefined, {
    pollingInterval: 10000,
    skipPollingIfUnfocused: true,
  });
  const rows = hotLeads?.rows ?? EMPTY_ROWS;
  // Dials actually placed in the range, straight from vicidial_log and
  // stringee_calls. Deliberately NOT derived from `rows`: the grid only holds
  // calls that produced a recording worth analysing, so it undercounts dialling
  // by a wide margin (176 Stringee attempts -> 57 analysed on 2026-10-02).
  const dialTotals = hotLeads?.totals ?? EMPTY_TOTALS;

  // Admin-defined custom column definitions (global). Shown as extra grid columns for every row.
  const { data: formFields = [] } = useGetHotMetaLeadNotesMappingQuery();

  const [search, setSearch] = useState('');
  const [stringeeOnly, setStringeeOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const [theme, setTheme] = useState(readInitialTheme);
  useEffect(() => {
    try { localStorage.setItem(RV_THEME_KEY, theme); } catch { /* ignore */ }
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  const searched = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      [r.name, r.phone, r.email, r.agent_name, r.campaign_name]
        .some((v) => (v || '').toString().toLowerCase().includes(q))
    );
  }, [rows, search]);

  // Stringee-only view; the pill's count follows the search either way.
  const stringeeCount = useMemo(() => searched.filter((r) => r.is_stringee).length, [searched]);
  const dialerScoped = useMemo(
    () => (stringeeOnly ? searched.filter((r) => r.is_stringee) : searched),
    [searched, stringeeOnly],
  );

  // Call-disposition dropdown. Counts follow search + Stringee toggle, so each
  // option says how many rows picking it will leave.
  const statusOptions = useMemo(() => {
    const counts = {};
    dialerScoped.forEach((r) => {
      const c = statusCode(r);
      counts[c] = (counts[c] || 0) + 1;
    });
    const known = DISPOSITIONS.map((d) => d.value);
    // VICIdial statuses are configurable: codes not in DISPOSITIONS still get an option.
    const extra = Object.keys(counts).filter((c) => c !== NO_STATUS && !known.includes(c)).sort();
    return [
      ...DISPOSITIONS.map((d) => ({ value: d.value, label: `${d.label} (${d.value})`, count: counts[d.value] || 0 })),
      ...extra.map((c) => ({ value: c, label: c, count: counts[c] })),
      { value: NO_STATUS, label: 'No disposition', count: counts[NO_STATUS] || 0 },
    ];
  }, [dialerScoped]);

  const filtered = useMemo(
    () => (statusFilter === ALL_STATUSES
      ? dialerScoped
      : dialerScoped.filter((r) => statusCode(r) === statusFilter)),
    [dialerScoped, statusFilter],
  );

  const stats = useMemo(
    () => ({
      total: filtered.length,
      registered: filtered.filter((r) => r.client_registered === true).length,
      deposited: filtered.filter((r) => r.client_deposited === true).length,
    }),
    [filtered],
  );

  return (
    <div className="rv-scope space-y-2 stagger-children" data-theme={theme}>
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-b from-card/70 to-card/40 px-4 py-2.5 transition-smooth">
        <div className="pointer-events-none absolute inset-0 opacity-60
          bg-[radial-gradient(700px_circle_at_0%_0%,hsl(var(--primary)/0.10),transparent_55%),
             radial-gradient(600px_circle_at_100%_100%,hsl(var(--destructive)/0.07),transparent_55%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg border border-primary/30 bg-primary/10 grid place-items-center shrink-0">
              <Flame className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground leading-none">
                Hot Meta Leads
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isAdmin
                  ? 'All hot leads — admin view'
                  : 'Your assigned & unclaimed leads'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatPill
              label="Dials"
              value={dialTotals.total ?? '—'}
              title="Calls placed through VICIdial in this date range (vicidial_log, excluding VDAD)."
            />
            <StringeeToggle
              active={stringeeOnly}
              count={dialTotals.stringee ?? 0}
              shown={stringeeCount}
              onToggle={() => setStringeeOnly((v) => !v)}
            />
            <StatPill
              label="Shown"
              value={stats.total}
              title="Rows in the grid below — analysed calls only, after search and filters."
            />
            <StatusSelect value={statusFilter} options={statusOptions} total={dialerScoped.length} onChange={setStatusFilter} />
            <StatPill label="Registered" value={stats.registered} tone="active" />
            <StatPill label="Deposited" value={stats.deposited} tone="primary" />
            <div className="w-px h-4 bg-border mx-1" />
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, email…"
                className="w-56 rounded-md border border-input bg-input/40 pl-8 pr-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-smooth"
              />
            </div>
            {isAdmin && (
              <button
                onClick={() => setColumnsOpen(true)}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth"
                title="Manage custom columns"
              >
                <Columns3 className="w-3.5 h-3.5" />
                <span className="text-xs">Columns</span>
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth"
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="text-xs">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
            <button
              onClick={refetch}
              disabled={isFetching}
              className="h-7 w-7 grid place-items-center rounded-md border border-border bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            {isFetching && !isLoading && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> syncing
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main panel */}
      <div className="rounded-xl border border-border bg-card/60 overflow-hidden transition-smooth">
        {isError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-destructive animate-fade-in">
            <AlertTriangle className="w-8 h-8" />
            <p className="text-sm">Failed to load reporting data</p>
            <button
              onClick={refetch}
              className="text-xs underline text-destructive/80 hover:text-destructive transition-smooth"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={8} columns={8} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm animate-fade-in">
            {statusFilter !== ALL_STATUSES
              ? 'No calls with this disposition in this view.'
              : stringeeOnly
              ? 'No Stringee calls in this view.'
              : search ? 'No leads match your search.' : 'No leads found.'}
          </div>
        ) : (
          <HotLeadsGrid
            rows={filtered}
            currentUser={user}
            isAdmin={isAdmin}
            formFields={formFields}
            theme={theme}
            onRowClick={setSelectedLead}
          />
        )}
      </div>

      {isAdmin && columnsOpen && (
        <ManageCustomColumnsModal
          onClose={() => setColumnsOpen(false)}
          formFields={formFields}
        />
      )}

      {selectedLead && (
        <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
}

function StatPill({ label, value, tone = 'default', title }) {
  const toneCls = {
    default: 'text-foreground',
    active: 'text-[hsl(var(--status-active))]',
    primary: 'text-primary',
  }[tone];

  return (
    <span
      title={title}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/40 px-2.5 py-0.5"
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-mono-nums font-semibold ${toneCls}`}>{value}</span>
    </span>
  );
}

// Toggle beside Total: shows only calls carried by Stringee. Off, it reads like the
// other pills with a Stringee-red dot; on, it fills with the Stringee gradient.
function StringeeToggle({ active, count, shown, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      title={
        `${count} Stringee dial attempts in this range (stringee_calls). `
        + `${shown} of them produced an analysed call shown in the grid. `
        + (active ? 'Click to show all calls.' : 'Click to show only those Stringee rows.')
      }
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 transition-smooth ${
        active ? 'text-white shadow-sm' : 'border-border bg-card/40 hover:bg-secondary'
      }`}
      style={active ? { background: stringeeGradient('E6', '90deg'), borderColor: STRINGEE.red } : undefined}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: active ? '#fff' : STRINGEE.red }} />
      <span className={`text-xs ${active ? 'text-white' : 'text-muted-foreground'}`}>Stringee</span>
      <span
        className="text-xs font-mono-nums font-semibold"
        style={{ color: active ? '#fff' : STRINGEE.blue }}
      >
        {count}
      </span>
    </button>
  );
}

// Call-disposition filter (the grid's "Call Disposition" column, vici_call_status).
function StatusSelect({ value, options, total, onChange }) {
  const active = value !== ALL_STATUSES;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title="Filter by call disposition"
      className={`h-[22px] rounded-md border px-2 text-xs bg-card/40 focus:outline-none focus:border-primary/60 transition-smooth
        [&>option]:bg-popover [&>option]:text-popover-foreground ${
        active ? 'border-primary/60 text-primary' : 'border-border text-muted-foreground hover:bg-secondary'
      }`}
    >
      <option value={ALL_STATUSES}>All dispositions · {total}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.count === 0 && o.value !== value}>
          {o.label} · {o.count}
        </option>
      ))}
    </select>
  );
}
