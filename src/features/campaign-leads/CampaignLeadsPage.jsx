import { useState, useCallback } from 'react';
import {
  Radio, Plus, RefreshCw,
  Infinity, Pause, Ban,
  CheckCircle2, Clock3, Loader2, AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import {
  useGetCampaignLeadsQuery,
  useToggleCampaignLeadActiveMutation,
  useDeleteCampaignLeadMutation,
} from '@/services';
import { routeStatus, fmtDate, FILTERS } from './utils';
import StatCard from './components/StatCard';
import LeadCard from './components/LeadCard';
import SyncDrawer from './components/SyncDrawer';
import CreateRuleModal from './components/CreateRuleModal';
import LoadingSkeleton from './components/LoadingSkeleton';
import EmptyState from './components/EmptyState';
import ConfirmDeletePopup from '@/shared/components/ConfirmDeletePopup';

export default function CampaignLeadsPage() {
  const { success, error } = useToast();

  const { data: leads = [], isLoading, isFetching, isError, refetch } = useGetCampaignLeadsQuery(undefined, {
    pollingInterval: 30000,
    skipPollingIfUnfocused: true,
  });

  const [toggleActive] = useToggleCampaignLeadActiveMutation();
  const [deleteLead, { isLoading: deleteLoading }] = useDeleteCampaignLeadMutation();
  const [togglingId, setTogglingId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [syncLead,   setSyncLead]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filter,     setFilter]     = useState('all');

  const handleToggle = useCallback(async (id) => {
    setTogglingId(id);
    try {
      const res = await toggleActive(id).unwrap();
      success(`Rule #${id} ${res.isActive ? 'resumed' : 'paused'}`);
    } catch {
      error('Failed to toggle rule status');
    } finally {
      setTogglingId(null);
    }
  }, [toggleActive, success, error]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteLead(deleteTarget.id).unwrap();
      success(`Rule #${deleteTarget.id} deleted`);
      setDeleteTarget(null);
    } catch {
      error('Failed to delete rule');
    }
  }, [deleteLead, deleteTarget, success, error]);

  const counts = FILTERS.reduce((acc, { key }) => {
    acc[key] = key === 'all' ? leads.length : leads.filter((l) => routeStatus(l) === key).length;
    return acc;
  }, {});

  const liveCount     = counts.live;
  const realtimeCount = leads.filter((l) => routeStatus(l) === 'live' && !l.enddate).length;
  const visible       = filter === 'all' ? leads : leads.filter((l) => routeStatus(l) === filter);

  return (
    <div className="min-h-screen p-4 md:p-6 bg-[hsl(231_58%_6%)] text-white">
      <div className="mx-auto max-w-[1440px] space-y-5">

        {/* Page header */}
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

        {/* Summary stat strip */}
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
          <StatCard label="Total Rules"  value={leads.length}      sub="configured"          icon={Radio}        color="text-slate-400" />
          <StatCard label="Live Now"     value={liveCount}          sub="routing incoming"    icon={CheckCircle2} color="text-emerald-400" />
          <StatCard label="Realtime ∞"   value={realtimeCount}      sub="no expiry set"       icon={Infinity}     color="text-sky-400" />
          <StatCard label="Scheduled"    value={counts.scheduled}   sub="not started yet"     icon={Clock3}       color="text-amber-400" />
          <StatCard label="Paused"       value={counts.paused}      sub="manually stopped"    icon={Pause}        color="text-slate-500" />
          <StatCard label="Expired"      value={counts.expired}     sub="past end date"       icon={Ban}          color="text-rose-400" />
        </div>

        {/* Main card */}
        <div className="border border-border rounded-xl bg-card/60 p-4 md:p-5">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex gap-1.5 flex-wrap">
              {FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition
                    ${filter === key
                      ? 'border-sky-500/40 bg-sky-500/15 text-sky-200'
                      : 'border-white/8 bg-white/[0.03] text-slate-400 hover:text-slate-200 hover:bg-white/6'
                    }`}
                >
                  {label}
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold
                    ${filter === key ? 'bg-sky-500/30 text-sky-200' : 'bg-white/8 text-slate-500'}`}>
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
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Content */}
          {isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-rose-400">
              <AlertTriangle className="w-8 h-8" />
              <p className="text-sm">Failed to load routing rules</p>
              <button onClick={refetch} className="text-xs underline text-rose-300">Retry</button>
            </div>
          ) : isLoading ? (
            <LoadingSkeleton />
          ) : visible.length === 0 && filter === 'all' ? (
            <EmptyState onNew={() => setCreateOpen(true)} />
          ) : visible.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">No {filter} rules right now</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
              {visible.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onToggle={handleToggle}
                  onSync={setSyncLead}
                  onDelete={setDeleteTarget}
                  toggling={togglingId === lead.id}
                  deleting={deleteLoading && deleteTarget?.id === lead.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateRuleModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <SyncDrawer lead={syncLead} onClose={() => setSyncLead(null)} />

      <ConfirmDeletePopup
        open={!!deleteTarget}
        title="Delete routing rule?"
        loading={deleteLoading}
        onCancel={() => (deleteLoading ? null : setDeleteTarget(null))}
        onConfirm={handleConfirmDelete}
        message={
          deleteTarget ? (
            <span className="block space-y-2">
              <span className="block">
                Are you sure you want to delete this rule? This action cannot be undone.
              </span>
              <span className="block rounded-md border border-slate-700/60 bg-slate-800/40 p-2.5 text-xs font-mono text-slate-300 space-y-1">
                <span className="block"><span className="text-slate-500">id:</span> #{deleteTarget.id}</span>
                <span className="block"><span className="text-slate-500">→ campaign:</span> {deleteTarget.destination_campaign}</span>
                <span className="block"><span className="text-slate-500">source:</span> {deleteTarget.source}</span>
                <span className="block"><span className="text-slate-500">form:</span> {deleteTarget.form_name}</span>
                <span className="block">
                  <span className="text-slate-500">window:</span>{' '}
                  {fmtDate(deleteTarget.startdate)} → {deleteTarget.enddate ? fmtDate(deleteTarget.enddate) : '∞ realtime'}
                </span>
              </span>
            </span>
          ) : null
        }
      />
    </div>
  );
}
