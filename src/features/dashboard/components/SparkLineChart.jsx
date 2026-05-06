import {
    AreaChart,
    Area,
    ResponsiveContainer,
  } from "recharts";

  export function StatSparkline({ data, color = "#209797" }) {
    return (
      <div className="h-10 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>

            <Area
              type="linear"
              dataKey="value"
              stroke={color}
              strokeWidth={1.8}
              fill="url(#sparkGradient)"
            //   dot={true}
            filter="drop-shadow(0 0 6px rgba(47,123,255,0.6))"
              dot={{ r: 1.5, strokeWidth: 1, fill: "#209797", stroke: color }}
              activeDot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }
