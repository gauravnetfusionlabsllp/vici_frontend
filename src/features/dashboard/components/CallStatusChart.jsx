import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { SkeletonChart } from '@/shared/components/ui';

const STATUS_COLORS = {
  READY: '#3b82f6',
  PAUSED: '#10b981',
  Total: '#f59e0b',
  INCALL: '#8b5cf6',
};

export function CallStatusChart({ callStatus ,CallStatusLoading = true}) {
  // const { total, breakdown } = callStatus;
    const rows = callStatus?.data?.[0] ?? {};

    // Identify the total key (key containing 'Total', case-insensitive)
    const totalKey = Object.keys(rows).find((key) => /total/i.test(key));

    // Prepare the breakdown excluding the total
    const breakdown = Object.entries(rows)
      .filter(([key]) => key !== totalKey)
      .map(([name, value]) => ({ name, value }));

      let total = rows[totalKey] ?? 0;
  const data = useMemo(() => {
    return breakdown
      // .filter(item => item.value > 0)
      .map(item => ({
        name: item.name,
        value: item.value,
        color: STATUS_COLORS[item.name?.toUpperCase()] || '#64748b',
      }));
  }, [breakdown]);

  const inCallValue =
    data.find(item => item.name === 'INCALL')?.value ?? 0;

  const hasData = data.length > 0;
return CallStatusLoading ? (
    <SkeletonChart type="pie" height={200} />
  ) :
   (
    <div className="relative w-full h-[200px] animate-fade-in">
      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
          No call data
        </div>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <PieChart role="img" aria-label="Call status distribution">
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={46}
            outerRadius={74}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.color}
                className="transition-opacity duration-200 hover:opacity-80"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"

            iconType="square"
            formatter={(value, props) => {
              const pct = total
                ? ((props.payload.value / total) * 100).toFixed(1)
                : 0;

              return (
                <span className="text-xs text-slate-300">
                  {value}: {props.payload.value} ({pct}%)
                </span>
              );
            }}
          />
        </PieChart>

      </ResponsiveContainer>

    </div>
  );
}
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const { name, value, color } = payload[0].payload;

  return (
    <div className="rounded-md bg-slate-900 border border-slate-700 px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs text-slate-300">
          {name}
        </span>
      </div>
      <div className="text-sm font-semibold text-white">
        {value}
      </div>
    </div>
  );
};
