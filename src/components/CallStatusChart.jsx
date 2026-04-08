import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

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
    <div className="flex items-center justify-center h-[170px]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ) :
   (
    <div className="relative w-full h-[170px]">
      {/* CENTER LABEL */}
      {/* <div className="absolute inset-5 mb-14 flex flex-col items-center justify-center pointer-events-none z-10">
        <div className="text-3xl font-bold font-mono text-white">
          {inCallValue}
        </div>
        <div className="text-xs text-slate-300 uppercase">
          In Call
        </div>
      </div> */}

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
            innerRadius={38}
            outerRadius={62}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.color}
                className="transition-opacity hover:opacity-80"
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