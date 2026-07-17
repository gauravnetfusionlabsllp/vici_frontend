import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { computeDailyLeadTrend } from '../utils';
import { useMvTheme, palette, ink } from '../theme';

export default function DailyTrendChart({ data }) {
  const theme = useMvTheme();
  const pal = palette(theme);
  const c = ink(theme);
  const rows = useMemo(() => computeDailyLeadTrend(data), [data]);

  if (rows.length === 0) {
    return <div className="h-[220px] grid place-items-center text-xs text-muted-foreground italic">No lead-creation data</div>;
  }

  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis dataKey="name" stroke={c.axis} fontSize={10} tickLine={false} axisLine={{ stroke: c.grid }} interval="preserveStartEnd" />
          <YAxis stroke={c.axis} fontSize={10} allowDecimals={false} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: c.cursor }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-md border px-3 py-2 shadow-lg" style={{ background: c.surface, borderColor: c.grid }}>
                  <div className="text-[11px]" style={{ color: c.text }}>{label}</div>
                  <div className="text-sm font-semibold font-mono-nums" style={{ color: c.text }}>{payload[0].value} leads</div>
                </div>
              ) : null
            }
          />
          <Bar dataKey="value" fill={pal[0]} radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
