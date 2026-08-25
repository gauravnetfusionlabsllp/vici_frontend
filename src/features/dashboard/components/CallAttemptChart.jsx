import { memo, useState } from 'react';
import { PhoneCall } from 'lucide-react';
import dayjs from 'dayjs';

import { IB_FILTERS, IB_LABELS, useGetMetaLeadIbAttemptsQuery } from '@/services';

import { META_COHORT_START } from '../metaCohort';

// Horizontal bars, because the reader's job here is comparing magnitude across
// ordered, long-named categories. Colour is therefore ORDINAL — one blue hue stepping
// with the dial count, never a hue per bar: the categories have an inherent order, so a
// rainbow would imply identity that isn't there.
//
// Steps run darkest → lightest as dials increase, validated as an ordinal ramp against
// this card's surface (#0E1633):
//   node scripts/validate_palette.js "#184f95,#2a78d6,#5598e7,#86b6ef,#b7d3f6" \
//     --ordinal --mode dark --surface "#0E1633"   → all checks pass
// Brightest lands on the highest dial counts, which are also the shortest bars, so the
// smallest marks stay the most visible on a dark surface.
const RAMP = ['#184f95', '#2a78d6', '#5598e7', '#86b6ef', '#b7d3f6'];

// Presentation only. /metalead-ib-attempts names the buckets and orders them; this maps
// its `key` onto a step of the ramp, darkest at 0 dials through lightest at 4+.
const BUCKET_COLOR = {
  not_dialled: RAMP[0],
  1: RAMP[1],
  2: RAMP[2],
  3: RAMP[3],
  '4_plus': RAMP[4],
};

// Holds the chart's shape while the first request is in flight; every number on screen
// comes from the API, so these carry labels only.
const PLACEHOLDER_ROWS = [
  { key: 'not_dialled', label: 'Not called yet',  note: '0 dials' },
  { key: '1',           label: 'Called once',     note: '1 dial' },
  { key: '2',           label: 'Called twice',    note: '2 dials' },
  { key: '3',           label: 'Called 3 times',  note: '3 dials' },
  { key: '4_plus',      label: 'Called 4+ times', note: '4+ dials' },
];

const fmtNum = (v) => (v == null ? '—' : Number(v).toLocaleString('en-IN'));
const fmtPct = (v) => `${Number(v ?? 0).toFixed(1).replace(/\.0$/, '')}%`;
// Chart geometry only — bar widths and gridline positions against the axis top.
// The data's own percentages arrive from the API as share_pct.
const pct = (part, whole) => (whole > 0 ? (part / whole) * 100 : 0);

/** Round the axis top up to a clean number and return three ticks for it. */
function axisTicks(max) {
  if (max <= 0) return { top: 1, ticks: [0] };
  const step = [50, 100, 250, 500, 1000, 2000, 5000, 10000].find((s) => max <= s * 4) || 20000;
  const top = Math.ceil(max / step) * step;
  return { top, ticks: [0, top / 2, top] };
}

function CallAttemptChartImpl() {
  const [ib, setIb] = useState('all');

  // Same arg shape the section uses, so RTK Query serves both from one cache entry.
  // Matched to the section's 60s cadence — at two minutes this card lagged behind the
  // tiles it sits beside, and both describe the same cohort. Focus-skipping is off for
  // the same reason it is there: the dashboard is watched on a screen that isn't focused.
  const { data, isLoading } = useGetMetaLeadIbAttemptsQuery(
    { sd: META_COHORT_START },
    { pollingInterval: 60000, skipPollingIfUnfocused: false },
  );

  const side = data?.breakdown?.[ib] || {};
  const {
    numbers = 0,
    total_attempts: totalDials = 0,
    avg_attempts: avgDials = 0,
  } = side;

  // Every distinct number lands in exactly one bucket, so the five shares sum to 100%.
  // Counts, labels and shares all arrive from the API; only the colour is added here.
  const bars = (side.rows?.length ? side.rows : PLACEHOLDER_ROWS).map((row) => ({
    ...row,
    color: BUCKET_COLOR[row.key],
  }));
  const { top, ticks } = axisTicks(Math.max(...bars.map((b) => b.numbers || 0), 0));

  return (
    <div className="p-2 border border-border rounded-lg bg-card/60 transition-smooth animate-fade-in-up">
      <div className="m-2 mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-semibold leading-tight text-white">
            <PhoneCall className="h-4 w-4 text-sky-400" aria-hidden="true" />
            Call Attempts per Number
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Distinct numbers by how many times they were dialled
            <span className="mx-1.5 text-slate-600">·</span>
            since {dayjs(META_COHORT_START).format('D MMM YYYY')}
          </p>
        </div>

        {/* Served from the same cached response, so switching sides is instant */}
        <div className="inline-flex items-center rounded-md border border-border bg-card/40 p-0.5">
          {IB_FILTERS.map((key) => (
            <button
              key={key}
              onClick={() => setIb(key)}
              className={`rounded px-2 py-0.5 text-[11px] transition-smooth ${
                ib === key
                  ? 'border border-primary/40 bg-primary/15 text-primary font-semibold'
                  : 'border border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {IB_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-2 pb-1">
        {bars.map((bar) => (
          <div
            key={bar.key}
            title={`${fmtNum(bar.numbers)} numbers — ${bar.note} (${fmtPct(bar.share_pct)} of ${fmtNum(numbers)})`}
            className="group flex items-center gap-2 rounded py-1 transition-smooth hover:bg-white/[0.04]"
          >
            {/* Label wears a text token; the coloured bar beside it carries the encoding */}
            <div className="w-[104px] shrink-0 text-[11px] leading-tight text-slate-300">
              {bar.label}
            </div>

            {/* Plot area — hairline gridlines sit behind the mark, one step off surface */}
            <div className="relative h-4 flex-1">
              {ticks.map((t) => (
                <div
                  key={t}
                  className="absolute top-0 h-full border-l border-white/[0.07]"
                  style={{ left: `${pct(t, top)}%` }}
                  aria-hidden="true"
                />
              ))}
              <div
                className="absolute top-1/2 h-3.5 -translate-y-1/2 rounded-r-[4px] transition-all duration-700 ease-out"
                style={{
                  width: isLoading
                    ? 0
                    : `max(${bar.numbers > 0 ? '3px' : '0px'}, ${pct(bar.numbers, top)}%)`,
                  backgroundColor: bar.color,
                }}
              />
            </div>

            <div className="flex w-[86px] shrink-0 items-baseline justify-end gap-1.5">
              <span className="font-mono-nums text-sm font-semibold text-white">
                {isLoading ? '—' : fmtNum(bar.numbers)}
              </span>
              <span className="font-mono-nums text-[10px] text-slate-400">
                {isLoading ? '' : fmtPct(bar.share_pct)}
              </span>
            </div>
          </div>
        ))}

        {/* X-axis band — inside the card, so nothing gets clipped */}
        <div className="mt-1 flex items-center gap-2">
          <div className="w-[104px] shrink-0" />
          <div className="relative h-4 flex-1">
            {ticks.map((t) => (
              <span
                key={t}
                className="absolute top-0 -translate-x-1/2 font-mono-nums text-[10px] text-slate-500"
                style={{ left: `${pct(t, top)}%` }}
              >
                {fmtNum(t)}
              </span>
            ))}
          </div>
          <div className="w-[86px] shrink-0" />
        </div>
      </div>

      <div className="mt-1 flex flex-wrap justify-between gap-x-3 gap-y-1 border-t border-slate-700 p-2 pb-0 text-[11px]">
        <span className="text-slate-300">
          <span className="font-mono-nums font-semibold text-white">
            {isLoading ? '—' : fmtNum(numbers)}
          </span>{' '}
          numbers total
        </span>
        <span className="text-slate-300">
          <span className="font-mono-nums font-semibold text-white">
            {isLoading ? '—' : fmtNum(totalDials)}
          </span>{' '}
          dials placed
        </span>
        <span className="text-slate-300">
          <span className="font-mono-nums font-semibold text-white">
            {isLoading ? '—' : Number(avgDials ?? 0).toFixed(2)}
          </span>{' '}
          dials per called number
        </span>
      </div>
    </div>
  );
}

export const CallAttemptChart = memo(CallAttemptChartImpl);

export default CallAttemptChart;
