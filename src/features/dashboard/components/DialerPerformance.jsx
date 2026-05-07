import { Users } from "lucide-react"
import {
  RadialBarChart,
  RadialBar,
  LineChart,
  Line,
  ResponsiveContainer,
  PolarAngleAxis,
} from "recharts"
import { useMemo } from "react"
import { Skeleton, SkeletonChart } from "@/shared/components/ui"

/* Sparkline demo data */
const sparkData = [
  { v: 20 },
  { v: 45 },
  { v: 22 },
  { v: 70 },
  { v: 28 },
  { v: 35 },
  { v: 32 },
]
const toSparkData = (arr) => arr?.map(v => ({ v })) || sparkData
/* ------------------ MAIN COMPONENT ------------------ */
const num = (v) => Number(v ?? 0);
export default function DialerPerformance({ data, isLoading ,graphData,isGraphDataLoading}) {
  /* ------------------ STATES ------------------ */

  if (isLoading || isGraphDataLoading) {
    return <LoadingState />
  }

  if (!data?.data?.length || !graphData) {
    return <EmptyState />
  }

  /* ------------------ SAFE DATA ------------------ */

  const s = data.data[0] ?? {
    dial_level: 0,
    calls_per_agent_per_hour: 0,
    drop_rate_percent: 0,
    avg_answer_speed_sec: 0,
    connection_rate_percent: 0,
  }

  /* ------------------ DERIVED VALUES ------------------ */

  const dialValue = useMemo(
    () => Math.min(Math.max(s?.dial_level, 0), 100),
    [s.dial_level]
  )

  const gaugeData = useMemo(
    () => [{ full: 100, value: dialValue }],
    [dialValue]
  )

  /* ------------------ RENDER ------------------ */

  return (
    <div className="p-2 h-full border border-border rounded-lg bg-card/60 animate-fade-in-up">
      {/* HEADER */}
      <Header />

      <div className="border border-border rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.45)] p-2 space-y-2">
        {/* TOP */}
        <div className="grid grid-cols-2 gap-3">
          {/* LEFT */}
          <div>
          <div className="p-2 ">
            <LabelValue label="Dial Level" value={num(s?.dial_level)?.toFixed(1)|| null} />
</div>
            <div className="p-2 pb-0 border-t border-white/10">
              <LabelValue
                label="Calls per Agent / hr"
                value={s.calls_per_agent_per_hour}
              />
            </div>
          </div>

          {/* GAUGE */}
          <Gauge
            value={dialValue}
            rawValue={s.dial_level}
            gaugeData={gaugeData}
          />
        </div>

        {/* MIDDLE */}
        <div className="py-2 border-t border-white/10 grid grid-cols-2 gap-3">
          <MetricSpark
            label="Drop Rate"
            value={`${s.drop_rate_percent}%`}
            color="#eab308"
            data={toSparkData(graphData.drop_rate_percentage)}
          />
          <MetricSpark
            label="Answer Speed"
            value={`${num(s?.avg_answer_speed_sec)?.toFixed(2)|| null}s`}
            color="#22c55e"
            data={toSparkData(graphData.connection_rate_percentage)}
          />
        </div>

        {/* BOTTOM */}
        <BottomSection value={s.connection_rate_percent}  data={toSparkData(graphData.connection_rate_percentage)} />
      </div>
    </div>
  )
}

/* ------------------ SUB COMPONENTS ------------------ */

function Header() {
  return (
    <div className="flex justify-between items-center m-2 lg:mb-4">
      <h3 className="text-xl leading-[1rem] font-semibold text-white flex items-center gap-2">
        <Users className="w-4 h-4 text-emerald-400" />
        Dialer Performance
      </h3>
    </div>
  )
}

function Gauge({ value, rawValue, gaugeData }) {
  return (
    <div className="relative h-[140px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="62%"
          innerRadius="90%"
          outerRadius="98%"
          startAngle={0}
          endAngle={180}
          data={gaugeData}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            tick={false}
          />

          <defs>
            <linearGradient id="dialGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>

          <RadialBar
            dataKey="full"
            stackId="dial"
            fill="#1f2937"
            cornerRadius={20}
          />

          <RadialBar
            dataKey="value"
            stackId="dial"
            fill="url(#dialGradient)"
            cornerRadius={20}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      <div className="absolute inset-x-0 bottom-12 text-center text-2xl font-semibold">
        {num(rawValue)?.toFixed(1)}
      </div>

      <div className="absolute bottom-7 left-3 text-xs text-gray-400">0</div>
      <div className="absolute bottom-7 right-3 text-xs text-gray-400">100</div>
    </div>
  )
}

function BottomSection({ value ,data}) {
  return (
    <div className="border-t border-white/10 pt-2">
      <div className="flex items-end justify-between">
        <div className="text-xs text-gray-400">Connection Rate</div>
        <div className="text-b font-semibold text-green-400">{value}%</div>
      </div>

      <div className="mt-1 h-5">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="linear"
              dataKey="v"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function MetricSpark({ label, value, color ,data }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-sm font-medium" style={{ color }}>
          {value}
        </span>
      </div>

      <div className="mt-1 h-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ------------------ STATES ------------------ */

function LoadingState() {
  return (
    <div className="p-2 h-full border border-border rounded-lg bg-card/60 animate-fade-in">
      <Header />
      <div className="border border-border rounded-sm p-2 space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-3">
            <div className="p-2 space-y-2">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-7 w-16" />
            </div>
            <div className="p-2 pb-0 border-t border-white/10 space-y-2">
              <Skeleton className="h-2.5 w-28" />
              <Skeleton className="h-7 w-12" />
            </div>
          </div>
          <SkeletonChart type="gauge" height={140} />
        </div>
        <div className="py-2 border-t border-white/10 grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
        <div className="border-t border-white/10 pt-2 space-y-2">
          <div className="flex items-end justify-between">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-5 w-full" />
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="h-full rounded-xl bg-card/60 p-4 flex items-center justify-center text-gray-400">
      No Dialer Performance Data
    </div>
  )
}

function LabelValue({ label, value }) {
  return (
    <>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </>
  )
}
