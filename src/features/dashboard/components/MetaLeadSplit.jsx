import { memo } from 'react';
import { Users, Phone, PauseCircle, CalendarRange, Briefcase, UserRound, RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';

import { useGetMetaLeadStatsRangeQuery } from '@/services';
import { SkeletonOverviewCard } from '@/shared/components/ui';

import { META_COHORT_START } from '../metaCohort';

// Cohort floor lives in ../metaCohort so this section and the call-attempt chart cannot
// drift apart; what counts as "called" is set once in the services layer (CALLED_BASIS).
// Re-exported for existing importers.
// The per-number dial-count breakdown lives in CallAttemptChart, not here.
export { META_COHORT_START };

const TONE = {
  sky: {
    ring: 'border-sky-500/30',
    tint: 'from-sky-500/12 via-sky-500/5 to-transparent',
    glow: 'shadow-sky-500/10',
    chip: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
    text: 'text-sky-300',
    bar: 'bg-sky-400',
    dot: 'bg-sky-400',
    dotGlow: 'rgba(56,189,248,0.65)',
  },
  violet: {
    ring: 'border-violet-500/30',
    tint: 'from-violet-500/12 via-violet-500/5 to-transparent',
    glow: 'shadow-violet-500/10',
    chip: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
    text: 'text-violet-300',
    bar: 'bg-violet-400',
    dot: 'bg-violet-400',
    dotGlow: 'rgba(167,139,250,0.65)',
  },
  emerald: {
    ring: 'border-emerald-500/30',
    tint: 'from-emerald-500/12 via-emerald-500/5 to-transparent',
    glow: 'shadow-emerald-500/10',
    chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    text: 'text-emerald-300',
    bar: 'bg-emerald-400',
    dot: 'bg-emerald-400',
    dotGlow: 'rgba(52,211,153,0.65)',
  },
  rose: {
    ring: 'border-rose-500/30',
    tint: 'from-rose-500/12 via-rose-500/5 to-transparent',
    glow: 'shadow-rose-500/10',
    chip: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
    text: 'text-rose-300',
    bar: 'bg-rose-400',
    dot: 'bg-rose-400',
    dotGlow: 'rgba(251,113,133,0.65)',
  },
};

const GROUPS = [
  {
    key: 'ib',
    title: 'IB',
    caption: 'Introducing brokers',
    prefix: 'IB',
    icon: Briefcase,
    tone: 'sky',
  },
  {
    key: 'non_ib',
    title: 'Non-IB',
    caption: 'Everything else, incl. forms that never asked',
    prefix: 'Non-IB',
    icon: UserRound,
    tone: 'violet',
  },
];

const pct = (part, whole) => (whole > 0 ? (part / whole) * 100 : 0);
const fmtPct = (v) => `${v.toFixed(1).replace(/\.0$/, '')}%`;
const fmtNum = (v) => (v == null ? '—' : Number(v).toLocaleString('en-IN'));

/** One metric tile: micro label, icon chip, hero number, and a share bar with caption. */
function StatTile({ label, value, icon: Icon, tone: toneKey, share, caption }) {
  const tone = TONE[toneKey] || TONE.sky;

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-lg border
                  ${tone.ring} bg-card/60 p-3.5 backdrop-blur-sm
                  shadow-[0_8px_30px_rgba(0,0,0,0.45)] ${tone.glow}
                  transition-smooth hover-lift hover:bg-card/80
                  hover:shadow-[0_14px_44px_rgba(0,0,0,0.55)]`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tone.tint}`} />
      {/* Accent rail — carries the tile's tone without another border colour */}
      <div className={`pointer-events-none absolute left-0 top-0 h-full w-[3px] ${tone.bar} opacity-60`} />

      <div className="relative flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-300/90">
          {label}
        </p>
        {Icon && (
          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border ${tone.chip}`}>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="relative mt-2 flex items-end gap-2">
        <span className="font-mono-nums text-3xl font-bold leading-none text-white">
          {fmtNum(value)}
        </span>
        <span className={`mb-0.5 font-mono-nums text-xs font-semibold ${tone.text}`}>
          {fmtPct(share)}
        </span>
      </div>

      <div className="relative mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full ${tone.bar} transition-all duration-700 ease-out`}
            style={{ width: `${Math.min(100, Math.max(share, share > 0 ? 2 : 0))}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-slate-400">{caption}</p>
      </div>
    </div>
  );
}

/** One side of the IB split: header with reach bar, then its three tiles. */
function SplitGroup({ group, funnel, cohortTotal, isLoading }) {
  const tone = TONE[group.tone];
  const { total_leads: total = 0, called_leads: called = 0, pending_leads: pending = 0 } = funnel || {};
  const reach = pct(called, total);
  const shareOfCohort = pct(total, cohortTotal);
  const GroupIcon = group.icon;

  const tiles = [
    {
      label: `${group.prefix} Total Leads`,
      value: total,
      icon: Users,
      tone: group.tone,
      share: shareOfCohort,
      caption: `of ${fmtNum(cohortTotal)} META leads in range`,
    },
    {
      label: `${group.prefix} Called Leads`,
      value: called,
      icon: Phone,
      tone: 'emerald',
      share: reach,
      caption: 'at least one dial logged',
    },
    {
      label: `${group.prefix} Pending Leads`,
      value: pending,
      icon: PauseCircle,
      tone: 'rose',
      share: pct(pending, total),
      caption: 'no dial logged yet',
    },
  ];

  return (
    <div className={`rounded-lg border ${tone.ring} bg-black/20 p-3`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={`grid h-7 w-7 place-items-center rounded-lg border ${tone.chip}`}>
            <GroupIcon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight text-white">
              {group.title}
              <span
                className={`ml-2 rounded-full border px-1.5 py-0.5 align-middle font-mono-nums
                            text-[10px] font-semibold ${tone.chip}`}
              >
                {isLoading ? '·' : fmtPct(shareOfCohort)} of cohort
              </span>
            </p>
            <p className="text-[10px] text-slate-400">{group.caption}</p>
          </div>
        </div>

        {/* Reach: how far this side has been dialled through */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-400">Reach</span>
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/[0.06] sm:w-40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all duration-700 ease-out"
              style={{ width: `${isLoading ? 0 : reach}%` }}
            />
          </div>
          <span className="font-mono-nums text-xs font-semibold text-emerald-300">
            {isLoading ? '—' : fmtPct(reach)}
          </span>
        </div>
      </div>

      {/* grid-cols-3 from sm up: the triple reads as one funnel, so it must never split 2+1 */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 stagger-children">
        {isLoading
          ? tiles.map((t) => <SkeletonOverviewCard key={t.label} className="h-[8.25rem] rounded-lg" />)
          : tiles.map((t) => <StatTile key={t.label} {...t} />)}
      </div>
    </div>
  );
}

function MetaLeadSplitImpl() {
  // Refreshes once a minute. skipPollingIfUnfocused is deliberately OFF: this panel is
  // watched on a wall display, where the browser rarely holds focus and the leads keep
  // arriving regardless. `fulfilledTimeStamp` drives the visible "updated" stamp below,
  // so a stalled poll is obvious instead of silent.
  const { data, isLoading, isFetching, fulfilledTimeStamp, refetch } =
    useGetMetaLeadStatsRangeQuery(
      { sd: META_COHORT_START },
      { pollingInterval: 60000, skipPollingIfUnfocused: false },
    );

  const breakdown = data?.breakdown || {};
  const overall = breakdown.all || {};
  const cohortTotal = overall.total_leads || 0;
  const overallReach = pct(overall.called_leads || 0, cohortTotal);

  const summary = [
    { label: 'Total', value: overall.total_leads, tone: 'sky' },
    { label: 'Called', value: overall.called_leads, tone: 'emerald' },
    { label: 'Pending', value: overall.pending_leads, tone: 'rose' },
  ];

  return (
    <div
      className="relative max-w-[1440px] overflow-hidden rounded-xl border border-border
                 bg-gradient-to-b from-card/70 to-card/40 p-2
                 shadow-[0_18px_60px_rgba(0,0,0,0.35)] animate-fade-in-up"
    >
      {/* Ambient wash so the section reads as its own surface, not a repeat of the KPI strip */}
      <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(600px_circle_at_12%_0%,rgba(56,189,248,0.12),transparent_55%),radial-gradient(600px_circle_at_88%_5%,rgba(167,139,250,0.12),transparent_55%)]" />

      <div className="relative">
        {/* ── Section header ── */}
        <div className="m-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-sky-500/25 bg-sky-500/15">
              <CalendarRange className="h-4 w-4 text-sky-300" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold leading-tight text-white sm:text-xl">
                Leads — IB vs Non-IB
              </h2>
              <p className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-400">
                <span>{dayjs(META_COHORT_START).format('D MMM YYYY')} → till date</span>
                <span className="text-slate-600">·</span>
                <span>independent of the date filter above</span>
                <span className="text-slate-600">·</span>
                {/* Proof the minute poll is alive — the stamp moves on every refresh — and
                    a way to pull fresh numbers on demand without reloading the page. */}
                <button
                  type="button"
                  onClick={refetch}
                  disabled={isFetching}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25
                             bg-emerald-500/10 px-2 py-0.5 font-mono-nums text-[10px] text-emerald-200/90
                             transition-smooth hover:border-emerald-400/40 hover:bg-emerald-500/20
                             disabled:cursor-default"
                  title="Reloads automatically every 60 seconds — click to refresh now"
                >
                  {/* A live dot + a clock that visibly moves: the panel's freshness should be
                      readable at a glance from across the room, not inferred. */}
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-slow"
                    style={{ boxShadow: '0 0 8px rgba(52,211,153,0.65)' }}
                  />
                  {fulfilledTimeStamp
                    ? `LIVE · updated ${dayjs(fulfilledTimeStamp).format('h:mm:ss A')}`
                    : 'connecting…'}
                  <RefreshCw
                    className={`h-2.5 w-2.5 ${isFetching ? 'animate-spin text-emerald-300' : 'opacity-60'}`}
                    aria-hidden="true"
                  />
                </button>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {summary.map(({ label, value, tone }) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 ${TONE[tone].chip}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${TONE[tone].dot} animate-pulse-slow`}
                  style={{ boxShadow: `0 0 8px ${TONE[tone].dotGlow}` }}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                  {label}
                </span>
                <span className="font-mono-nums text-sm font-bold text-white">
                  {isLoading ? '—' : fmtNum(value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Cohort-wide reach bar: called vs pending across both sides ── */}
        <div className="mx-2 mb-3">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-700 ease-out"
              style={{ width: `${isLoading ? 0 : overallReach}%` }}
            />
            <div className="h-full flex-1 bg-rose-500/35" />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-400">
            <span>
              {isLoading
                ? 'Loading cohort…'
                : `${fmtPct(overallReach)} of the cohort has been dialled at least once`}
            </span>
            <span>{isLoading ? '' : `${fmtNum(overall.pending_leads)} still pending`}</span>
          </div>
        </div>

        {/* ── The two sides ── */}
        <div className="space-y-2.5">
          {GROUPS.map((group) => (
            <SplitGroup
              key={group.key}
              group={group}
              funnel={breakdown[group.key]}
              cohortTotal={cohortTotal}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const MetaLeadSplit = memo(MetaLeadSplitImpl);

export default MetaLeadSplit;
