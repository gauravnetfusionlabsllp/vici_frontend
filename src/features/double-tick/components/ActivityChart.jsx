import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';

import { useDtTheme, palette, ink, DIRECTION_SLOT } from '../theme';
import ChartTooltip from './ChartTooltip';

const fmtDay = (d) => {
  const [, m, day] = d.split('-');
  return `${day}/${m}`;
};

/**
 * Daily conversation activity — two series (what customers sent vs what the team sent).
 *
 * Line, because the job is trend-over-time. 2px strokes, ≥8px end markers ringed in the
 * surface colour, hairline solid grid. A legend is always present for two series, and the
 * final point of each line is direct-labelled so identity never rests on colour alone.
 */
export default function ActivityChart({ data }) {
  const theme = useDtTheme();
  const pal = palette(theme);
  const c = ink(theme);

  const colors = {
    customer: pal[DIRECTION_SLOT.customer],
    agent: pal[DIRECTION_SLOT.agent],
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={c.grid} strokeDasharray="0" vertical={false} />
        <XAxis
          dataKey="day"
          tickFormatter={fmtDay}
          stroke={c.axis}
          fontSize={10}
          tickLine={false}
          axisLine={{ stroke: c.grid }}
          minTickGap={16}
        />
        <YAxis
          stroke={c.axis}
          fontSize={10}
          width={48}
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v.toLocaleString()}
        />
        <Tooltip
          content={<ChartTooltip ink={c} labelFormatter={fmtDay} />}
          cursor={{ stroke: c.grid, strokeWidth: 1 }}
        />
        <Legend
          verticalAlign="top"
          align="left"
          height={24}
          iconType="plainline"
          iconSize={14}
          wrapperStyle={{ fontSize: 11 }}
          // Recharts tints legend text with the series colour by default. Text wears text
          // tokens — the line swatch beside it is what carries identity.
          formatter={(value) => <span style={{ color: c.text }}>{value}</span>}
        />
        <Line
          name="From customers"
          type="linear"
          dataKey="customer"
          stroke={colors.customer}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          dot={false}
          activeDot={{ r: 4, fill: colors.customer, stroke: c.surface, strokeWidth: 2 }}
        />
        <Line
          name="From your team"
          type="linear"
          dataKey="agent"
          stroke={colors.agent}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          dot={false}
          activeDot={{ r: 4, fill: colors.agent, stroke: c.surface, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
