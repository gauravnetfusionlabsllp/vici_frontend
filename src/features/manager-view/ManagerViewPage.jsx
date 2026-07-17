import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { LayoutDashboard, RefreshCw, Loader2, AlertTriangle, Inbox } from 'lucide-react';

import {
  useGetManagerViewCombinedQuery,
  useGetManagerViewFilterSetsQuery,
  useGetManagerViewCallAnalysisQuery,
  useGetManagerViewMetaLeadsQuery,
  useGetManagerViewHotNotesQuery,
} from '@/services';
import { useToast } from '@/shared/hooks/useToast';
import { SkeletonTable, SkeletonChart, SkeletonStat } from '@/shared/components/ui';

import FilterBar from './components/FilterBar';
import KpiBand from './components/KpiBand';
import SummarySections from './components/SummarySections';
import Charts from './components/Charts';
import CombinedGrid from './components/CombinedGrid';
import CallDetailModal from './components/CallDetailModal';
import StandaloneGrid from './components/StandaloneGrid';
import ThemeToggle from './components/ThemeToggle';
import { callAnalysisColumns, metaLeadsColumns, hotNotesColumns } from './components/standaloneColumns';
import { computeReferenceKpis, todayYMD } from './utils';
import { MvThemeContext, MV_THEME_KEY, readInitialTheme } from './theme';

const EMPTY_OPTIONS = {
  form_name: [], campaign_name: [], ad_name: [], adset_name: [], source: [], agent_user: [], call_outcome: [],
};

const makeDefaultFilters = () => ({
  sd: todayYMD(), ed: todayYMD(),
  campaign_name: [], form_name: [], ad_name: [], adset_name: [], source: [],
  agent_user: '', call_outcome: '', phone: '',
});

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'calls', label: 'Call Analysis' },
  { key: 'leads', label: 'Meta Leads' },
  { key: 'notes', label: 'Hot Lead Notes' },
];

const LIMIT = 1000;

// Wraps a data panel with loading / error / empty states (keeps last good data on refetch error).
function QueryPanel({ query, isEmpty, emptyMsg, skeleton, onRetry, children }) {
  if (query.isError && !query.data) {
    const detail = query.error?.data?.detail || query.error?.error || 'Request failed';
    return (
      <div className="rounded-xl border border-border bg-card/60 flex flex-col items-center gap-3 py-16 text-destructive animate-fade-in">
        <AlertTriangle className="w-8 h-8" />
        <p className="text-sm">Failed to load data</p>
        <p className="text-xs text-muted-foreground max-w-md text-center">{String(detail)}</p>
        <button onClick={onRetry} className="text-xs underline text-destructive/80 hover:text-destructive transition-smooth">Retry</button>
      </div>
    );
  }
  if (query.isLoading) return skeleton;
  if (isEmpty) {
    return (
      <div className="rounded-xl border border-border bg-card/60 flex flex-col items-center gap-2 py-16 text-muted-foreground animate-fade-in">
        <Inbox className="w-8 h-8 opacity-60" />
        <p className="text-sm">{emptyMsg}</p>
      </div>
    );
  }
  return children;
}

export default function ManagerViewPage() {
  const { error: toastError } = useToast();
  const [theme, setTheme] = useState(readInitialTheme);
  const [activeTab, setActiveTab] = useState('overview');
  const [draft, setDraft] = useState(makeDefaultFilters);
  const [applied, setApplied] = useState(makeDefaultFilters);
  const [selectedCall, setSelectedCall] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  useEffect(() => {
    try { localStorage.setItem(MV_THEME_KEY, theme); } catch { /* ignore */ }
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  // Phone is a partial filter — debounce it live into the applied filters (SET/date/select
  // filters wait for Apply). Combined ignores phone; only the standalone tabs use it.
  useEffect(() => {
    const t = setTimeout(() => {
      setApplied((a) => (a.phone === draft.phone ? a : { ...a, phone: draft.phone }));
    }, 400);
    return () => clearTimeout(t);
  }, [draft.phone]);

  const combinedArgs = useMemo(() => ({
    sd: applied.sd, ed: applied.ed,
    campaign_name: applied.campaign_name, form_name: applied.form_name, ad_name: applied.ad_name,
    adset_name: applied.adset_name, source: applied.source,
    agent_user: applied.agent_user, call_outcome: applied.call_outcome, limit: LIMIT,
  }), [applied]);

  const callAnalysisArgs = useMemo(() => ({
    sd: applied.sd, ed: applied.ed, agent_user: applied.agent_user,
    call_outcome: applied.call_outcome, phone: applied.phone, limit: LIMIT,
  }), [applied]);

  const metaLeadsArgs = useMemo(() => ({
    sd: applied.sd, ed: applied.ed, campaign_name: applied.campaign_name, form_name: applied.form_name,
    ad_name: applied.ad_name, adset_name: applied.adset_name, source: applied.source,
    phone: applied.phone, limit: LIMIT,
  }), [applied]);

  const hotNotesArgs = useMemo(() => ({
    sd: applied.sd, ed: applied.ed, campaign_name: applied.campaign_name, form_name: applied.form_name,
    ad_name: applied.ad_name, adset_name: applied.adset_name, source: applied.source,
    agent_user: applied.agent_user, limit: LIMIT,
  }), [applied]);

  const combined = useGetManagerViewCombinedQuery(combinedArgs);
  const filterSets = useGetManagerViewFilterSetsQuery({ sd: applied.sd, ed: applied.ed });
  const callAnalysis = useGetManagerViewCallAnalysisQuery(callAnalysisArgs, { skip: activeTab !== 'calls' });
  const metaLeads = useGetManagerViewMetaLeadsQuery(metaLeadsArgs, { skip: activeTab !== 'leads' });
  const hotNotes = useGetManagerViewHotNotesQuery(hotNotesArgs, { skip: activeTab !== 'notes' });

  useEffect(() => {
    if (combined.isSuccess) setLastRefreshed(new Date());
  }, [combined.fulfilledTimeStamp, combined.isSuccess]);

  useEffect(() => {
    if (combined.isError) {
      const detail = combined.error?.data?.detail || combined.error?.error || 'Failed to refresh data';
      toastError(String(detail));
    }
  }, [combined.isError, combined.error, toastError]);

  const options = filterSets.data ?? EMPTY_OPTIONS;
  const rows = combined.data?.data ?? [];
  const kpis = useMemo(() => computeReferenceKpis(rows), [rows]);
  const isFetching = combined.isFetching || filterSets.isFetching;

  const handleApply = () => setApplied({ ...draft });
  const handleClear = () => { const d = makeDefaultFilters(); setDraft(d); setApplied(d); };
  const handleRefresh = () => {
    combined.refetch();
    filterSets.refetch();
    if (activeTab === 'calls') callAnalysis.refetch();
    if (activeTab === 'leads') metaLeads.refetch();
    if (activeTab === 'notes') hotNotes.refetch();
  };

  const overviewSkeleton = (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {Array.from({ length: 12 }).map((_, i) => <SkeletonStat key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonChart key={i} type="bars" height={220} />)}
      </div>
      <div className="rounded-xl border border-border bg-card/60 p-4"><SkeletonTable rows={8} columns={8} /></div>
    </div>
  );
  const gridSkeleton = <div className="rounded-xl border border-border bg-card/60 p-4"><SkeletonTable rows={8} columns={8} /></div>;

  const headerBtn =
    'inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[hsl(var(--mv-head-fg)/0.25)] bg-[hsl(var(--mv-head-fg)/0.10)] text-[hsl(var(--mv-head-fg))] hover:bg-[hsl(var(--mv-head-fg)/0.20)] transition-smooth disabled:opacity-50';

  return (
    <MvThemeContext.Provider value={theme}>
      <div className="mv-scope rounded-xl bg-background text-foreground p-3 md:p-4" data-theme={theme}>
        <div className="space-y-2.5 stagger-children">
          {/* Header — navy bar + teal live strip */}
          <div className="rounded-xl overflow-hidden border border-border">
            <div className="mv-head-bar px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[hsl(var(--mv-head-fg)/0.12)] grid place-items-center shrink-0">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <h1 className="text-base font-semibold leading-none">SGFX INDIA IB Campaign — Manager View</h1>
              </div>
              <div className="flex items-center gap-2">
                {isFetching && (
                  <span className="inline-flex items-center gap-1 text-[11px] opacity-80">
                    <Loader2 className="w-3 h-3 animate-spin" /> syncing
                  </span>
                )}
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
                <button onClick={handleRefresh} disabled={isFetching} className={headerBtn} title="Refresh">
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                  <span className="text-xs">Refresh</span>
                </button>
              </div>
            </div>
            <div className="px-4 py-1.5 text-center text-[11px] font-semibold tracking-wide bg-[hsl(var(--mv-accent))] text-[hsl(var(--mv-head))]">
              Live dashboard • Last refreshed: {lastRefreshed ? format(lastRefreshed, 'dd MMM yyyy, HH:mm:ss') : '—'}
            </div>
          </div>

          {/* Filter bar */}
          <FilterBar
            draft={draft}
            setDraft={setDraft}
            options={options}
            optionsLoading={filterSets.isLoading}
            onApply={handleApply}
            onClear={handleClear}
          />

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-border">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3.5 py-2 text-xs font-medium -mb-px border-b-2 transition-smooth
                  ${activeTab === t.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <QueryPanel
              query={combined}
              isEmpty={rows.length === 0}
              emptyMsg="No calls found for the selected filters."
              skeleton={overviewSkeleton}
              onRetry={combined.refetch}
            >
              <div className="space-y-2.5">
                <KpiBand kpis={kpis} />
                <Charts data={rows} />
                <SummarySections data={rows} />
                <CombinedGrid rows={rows} onRowClick={setSelectedCall} />
              </div>
            </QueryPanel>
          )}

          {activeTab === 'calls' && (
            <QueryPanel
              query={callAnalysis}
              isEmpty={(callAnalysis.data?.length ?? 0) === 0}
              emptyMsg="No calls found for the selected filters."
              skeleton={gridSkeleton}
              onRetry={callAnalysis.refetch}
            >
              <StandaloneGrid rows={callAnalysis.data ?? []} columnDefs={callAnalysisColumns} base="call-analysis"
                getRowId={(p) => `ca-${p.data.call_id}`} />
            </QueryPanel>
          )}

          {activeTab === 'leads' && (
            <QueryPanel
              query={metaLeads}
              isEmpty={(metaLeads.data?.length ?? 0) === 0}
              emptyMsg="No Meta leads found for the selected filters."
              skeleton={gridSkeleton}
              onRetry={metaLeads.refetch}
            >
              <StandaloneGrid rows={metaLeads.data ?? []} columnDefs={metaLeadsColumns} base="meta-leads"
                getRowId={(p) => `ml-${p.data.lead_id}`} />
            </QueryPanel>
          )}

          {activeTab === 'notes' && (
            <QueryPanel
              query={hotNotes}
              isEmpty={(hotNotes.data?.length ?? 0) === 0}
              emptyMsg="No lead notes found for the selected filters."
              skeleton={gridSkeleton}
              onRetry={hotNotes.refetch}
            >
              <StandaloneGrid rows={hotNotes.data ?? []} columnDefs={hotNotesColumns} base="hot-lead-notes"
                getRowId={(p) => `hn-${p.data.note_id}`} />
            </QueryPanel>
          )}

          {selectedCall && <CallDetailModal call={selectedCall} onClose={() => setSelectedCall(null)} />}
        </div>
      </div>
    </MvThemeContext.Provider>
  );
}
