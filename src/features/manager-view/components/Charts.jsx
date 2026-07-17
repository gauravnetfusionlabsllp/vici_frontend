import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, Legend, LabelList,
} from 'recharts';
import { Filter, PieChart as PieIcon, Users2 } from 'lucide-react';

import { computeLeadFunnel, computeLeadTypeMix, computeAgentWorkload } from '../utils';
import { useMvTheme } from '../theme';
import { palette, ink } from '../theme';
import { SectionCard } from './Section';

const SHORT_STAGE = {
  'Total Leads': 'Total', 'Assigned': 'Asgn', 'Disposition Updated': 'Dispo',
  'Interested': 'Intr', 'Account Opened': 'Acct', 'KYC Completed': 'KYC', 'FTD Received': 'FTD',
};

function ChartTooltip({ active, payload, label, ink: c }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border px-3 py-2 shadow-lg" style={{ background: c.surface, borderColor: c.grid }}>
      <div className="text-[11px]" style={{ color: c.text }}>{payload[0].payload.full ?? payload[0].name ?? label}</div>
      {payload.map((p) => (
        <div key={p.name} className="text-sm font-semibold font-mono-nums flex items-center gap-1.5" style={{ color: c.text }}>
          <span className="inline-block w-2 h-2 rounded-sm" style={{ background: p.color || p.fill }} />
          {p.name ? `${p.name}: ` : ''}{p.value}
        </div>
      ))}
    </div>
  );
}

function Empty() {
  return <div className="h-full grid place-items-center text-xs text-muted-foreground italic">No data</div>;
}

export default function Charts({ data }) {
  const theme = useMvTheme();
  const pal = palette(theme);
  const c = ink(theme);

  const funnel = useMemo(
    () => computeLeadFunnel(data).map((f) => ({ name: SHORT_STAGE[f.stage] || f.stage, full: f.stage, value: f.count })),
    [data],
  );
  const leadType = useMemo(() => computeLeadTypeMix(data).slice(0, 8), [data]);
  const workload = useMemo(() => computeAgentWorkload(data).slice(0, 8), [data]);

  const tip = <ChartTooltip ink={c} />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
      {/* Lead Conversion Funnel — single-series vertical bar */}
      <SectionCard title="Lead Conversion Funnel" icon={Filter} bodyClass="p-3 h-[240px]">
        {funnel.every((f) => f.value === 0) ? <Empty /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel} margin={{ top: 16, right: 8, left: -18, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
              <XAxis dataKey="name" stroke={c.axis} fontSize={10} tickLine={false} axisLine={{ stroke: c.grid }} />
              <YAxis stroke={c.axis} fontSize={10} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip content={tip} cursor={{ fill: c.cursor }} />
              <Bar dataKey="value" fill={pal[0]} radius={[4, 4, 0, 0]} maxBarSize={44}>
                <LabelList dataKey="value" position="top" fontSize={11} fill={c.text} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      {/* Lead Type Mix — categorical donut */}
      <SectionCard title="Lead Type Mix" icon={PieIcon} bodyClass="p-3 h-[240px]">
        {leadType.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={leadType} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={42} outerRadius={70} paddingAngle={2} stroke={c.surface} strokeWidth={2}>
                {leadType.map((_, i) => <Cell key={i} fill={pal[i % pal.length]} />)}
              </Pie>
              <Tooltip content={tip} />
              <Legend iconType="square" formatter={(v) => <span className="text-[10px]" style={{ color: c.text }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      {/* Agent Workload & Updates — 2-series grouped horizontal bars */}
      <SectionCard title="Agent Workload & Updates" icon={Users2} bodyClass="p-3 h-[240px]">
        {workload.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workload} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
              <XAxis type="number" stroke={c.axis} fontSize={10} allowDecimals={false} tickLine={false} axisLine={{ stroke: c.grid }} />
              <YAxis type="category" dataKey="agent" stroke={c.axis} fontSize={10} width={80} tickLine={false} axisLine={false}
                tickFormatter={(v) => (v.length > 12 ? `${v.slice(0, 11)}…` : v)} />
              <Tooltip content={tip} cursor={{ fill: c.cursor }} />
              <Legend iconType="square" formatter={(v) => <span className="text-[10px]" style={{ color: c.text }}>{v}</span>} />
              <Bar name="Assigned" dataKey="assigned" fill={pal[0]} radius={[0, 3, 3, 0]} maxBarSize={12} />
              <Bar name="Updated" dataKey="updated" fill={pal[1]} radius={[0, 3, 3, 0]} maxBarSize={12} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>
    </div>
  );
}
