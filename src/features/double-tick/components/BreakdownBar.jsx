import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LabelList,
} from 'recharts';

import { useDtTheme, palette, ink } from '../theme';
import ChartTooltip from './ChartTooltip';

/**
 * Horizontal bar for "compare magnitude" breakdowns (per agent, per tag, per message type).
 *
 * One series → one colour for every bar. A value-ramp here would double-encode bar length
 * as hue and burn the only free channel on information the length already carries.
 * Horizontal because the category names are long words, not dates.
 *
 * Values are direct-laid at the bar tip, so the numbers never depend on the hue clearing
 * contrast against the surface.
 */
export default function BreakdownBar({ data, nameKey = 'name', valueKey = 'value', unit = '' }) {
  const theme = useDtTheme();
  const c = ink(theme);
  const color = palette(theme)[0];

  // Leave room on the right so the tip label never gets clipped by the plot edge.
  const longest = Math.max(...data.map((d) => String(d[valueKey] ?? '').length), 1);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 2, right: 16 + longest * 7, left: 0, bottom: 2 }}
        barCategoryGap="26%"
      >
        {/* No gridlines: the value axis is hidden and every bar carries its own tip
            label, so a grid would be ink with nothing to reference. */}
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey={nameKey}
          width={138}
          stroke={c.axis}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          interval={0}
        />
        <Tooltip
          content={<ChartTooltip ink={c} />}
          cursor={{ fill: theme === 'dark' ? 'rgba(57,135,229,0.10)' : 'rgba(42,120,214,0.07)' }}
        />
        <Bar
          dataKey={valueKey}
          name={unit || 'Total'}
          fill={color}
          maxBarSize={22}
          radius={[0, 4, 4, 0]}
          isAnimationActive={false}
        >
          <LabelList
            dataKey={valueKey}
            position="right"
            offset={7}
            fill={c.text}
            fontSize={11}
            formatter={(v) => v.toLocaleString()}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
