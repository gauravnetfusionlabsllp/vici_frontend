import { useMemo } from 'react';
import { Filter, Users2, AlertTriangle, Activity, TrendingUp, PieChart, LineChart, ClipboardCheck } from 'lucide-react';

import {
  computeLeadFunnel, computeAgentPerformance, computePriorityActions,
  computeStatusOverview, computeConversionRates, computeCommunicationMix,
  computeDispositionMix, computeLeadTypeMix, computeExperienceMix, fmtPct,
} from '../utils';
import { SectionCard } from './Section';
import DailyTrendChart from './DailyTrendChart';
import DataCompletion from './DataCompletion';

// Horizontal share bar used by funnel + mixes.
function ShareRow({ label, count, share }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="w-32 shrink-0 truncate text-xs text-foreground/85" title={label}>{label}</span>
      <div className="flex-1 h-2 rounded-full bg-secondary/60 overflow-hidden">
        <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.max(share, 2)}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-mono-nums text-muted-foreground">{count}</span>
    </div>
  );
}

function MixCard({ title, rows }) {
  const total = rows.reduce((a, b) => a + b.count, 0);
  return (
    <SectionCard title={title} icon={PieChart}>
      {rows.length === 0 ? (
        <div className="py-6 text-center text-[11px] text-muted-foreground italic">No data</div>
      ) : (
        <div className="space-y-0.5">
          {rows.slice(0, 8).map((r) => (
            <ShareRow key={r.label} label={r.label} count={r.count} share={total ? (r.count / total) * 100 : 0} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export default function SummarySections({ data }) {
  const funnel = useMemo(() => computeLeadFunnel(data), [data]);
  const agents = useMemo(() => computeAgentPerformance(data), [data]);
  const priority = useMemo(() => computePriorityActions(data), [data]);
  const status = useMemo(() => computeStatusOverview(data), [data]);
  const rates = useMemo(() => computeConversionRates(data), [data]);
  const commMix = useMemo(() => computeCommunicationMix(data), [data]);
  const dispoMix = useMemo(() => computeDispositionMix(data), [data]);
  const leadTypeMix = useMemo(() => computeLeadTypeMix(data), [data]);
  const expMix = useMemo(() => computeExperienceMix(data), [data]);

  return (
    <div className="space-y-2.5">
      {/* Funnel · Agents · Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        <SectionCard title="Lead Funnel" icon={Filter}>
          <div className="space-y-0.5">
            {funnel.map((f) => (
              <div key={f.stage} className="flex items-center gap-2 py-1">
                <span className="w-32 shrink-0 truncate text-xs text-foreground/85">{f.stage}</span>
                <div className="flex-1 h-2 rounded-full bg-secondary/60 overflow-hidden">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.max(f.pct, 2)}%` }} />
                </div>
                <span className="w-10 shrink-0 text-right text-xs font-mono-nums text-foreground/80">{f.count}</span>
                <span className="w-12 shrink-0 text-right text-[11px] font-mono-nums text-muted-foreground">{fmtPct(f.pct)}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Agent Performance" icon={Users2}>
          {agents.length === 0 ? (
            <div className="py-6 text-center text-[11px] text-muted-foreground italic">No agent activity</div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin -mx-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="text-left font-medium py-1 px-1">Agent</th>
                    <th className="text-right font-medium py-1 px-1">Asgn</th>
                    <th className="text-right font-medium py-1 px-1">Updt</th>
                    <th className="text-right font-medium py-1 px-1">Intr</th>
                    <th className="text-right font-medium py-1 px-1">Acct</th>
                    <th className="text-right font-medium py-1 px-1">KYC</th>
                  </tr>
                </thead>
                <tbody className="font-mono-nums">
                  {agents.map((a) => (
                    <tr key={a.agent} className="border-t border-border/40">
                      <td className="py-1 px-1 font-sans text-foreground/85 truncate max-w-[9rem]" title={a.agent}>{a.agent}</td>
                      <td className="py-1 px-1 text-right text-foreground/80">{a.assigned}</td>
                      <td className="py-1 px-1 text-right text-foreground/80">{a.updated}</td>
                      <td className="py-1 px-1 text-right text-primary">{a.interested}</td>
                      <td className="py-1 px-1 text-right text-[hsl(var(--status-active))]">{a.accounts}</td>
                      <td className="py-1 px-1 text-right text-[hsl(var(--status-waiting))]">{a.kyc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Priority Actions" icon={AlertTriangle}>
          <div className="divide-y divide-border/40">
            {priority.map((p) => (
              <div key={p.action} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-foreground/85">{p.action}</span>
                <span className={`text-sm font-semibold font-mono-nums ${p.count > 0 ? 'text-[hsl(var(--status-waiting))]' : 'text-muted-foreground'}`}>
                  {p.count}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Lead Status Overview */}
      <SectionCard title="Lead Status Overview" icon={Activity}>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {status.map((s) => (
            <div key={s.status} className="rounded-lg border border-border/60 bg-secondary/30 px-2 py-2 text-center">
              <div className="text-xl font-bold font-mono-nums text-foreground leading-none">{s.count}</div>
              <div className="mt-1 text-[10px] text-muted-foreground uppercase tracking-wide leading-tight">{s.status}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Key Conversion Rates */}
      <SectionCard title="Key Conversion Rates" icon={TrendingUp}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {rates.map((r) => (
            <div key={r.label} className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 text-center">
              <div className="text-2xl font-bold font-mono-nums text-primary leading-none">{fmtPct(r.value)}</div>
              <div className="mt-1.5 text-[11px] text-muted-foreground uppercase tracking-wide">{r.label}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Mixes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
        <MixCard title="Lead Type Mix" rows={leadTypeMix} />
        <MixCard title="Experience Mix" rows={expMix} />
        <MixCard title="Communication Mix" rows={commMix} />
        <MixCard title="Disposition Mix" rows={dispoMix} />
      </div>

      {/* Daily Lead Trend · Data Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        <SectionCard title="Daily Lead Trend" icon={LineChart} bodyClass="p-3">
          <DailyTrendChart data={data} />
        </SectionCard>
        <SectionCard title="Data Completion" icon={ClipboardCheck}>
          <DataCompletion data={data} />
        </SectionCard>
      </div>
    </div>
  );
}
