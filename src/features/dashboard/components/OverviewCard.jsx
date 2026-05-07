import { useId } from "react";
import { StatSparkline } from "./SparkLineChart";

const TONE = {
  blue:  { ring: "border-blue-500/30",    tint: "from-blue-500/10  via-blue-500/5  to-transparent", glow: "shadow-blue-500/10",    icon: "text-blue-300",    stroke: "#60a5fa", dot: "bg-blue-400",    dotGlow: "rgba(96,165,250,0.65)"  },
  amber: { ring: "border-amber-500/30",   tint: "from-amber-500/10 via-amber-500/5 to-transparent", glow: "shadow-amber-500/10",   icon: "text-amber-300",   stroke: "#fbbf24", dot: "bg-amber-400",   dotGlow: "rgba(251,191,36,0.65)"  },
  slate: { ring: "border-slate-600/30",   tint: "from-slate-500/10 via-slate-500/5 to-transparent", glow: "shadow-slate-500/10",   icon: "text-slate-300",   stroke: "#94a3b8", dot: "bg-slate-400",   dotGlow: "rgba(148,163,184,0.55)" },
  green: { ring: "border-emerald-500/30", tint: "from-emerald-500/10 via-emerald-500/5 to-transparent", glow: "shadow-emerald-500/10", icon: "text-emerald-300", stroke: "#34d399", dot: "bg-emerald-400", dotGlow: "rgba(52,211,153,0.65)"  },
  red:   { ring: "border-red-500/30",     tint: "from-red-500/10   via-red-500/5   to-transparent", glow: "shadow-red-500/10",     icon: "text-red-300",     stroke: "#f87171", dot: "bg-red-400",     dotGlow: "rgba(248,113,113,0.65)" },
};

const CURVE = "M0 28 C 28 12, 56 32, 100 22 S 168 8, 200 20";

function PulseTrail({ tone }) {
  const id = useId().replace(/:/g, "");
  const fillId = `pt-fill-${id}`;
  const lineId = `pt-line-${id}`;

  return (
    <div className="relative h-10 w-full" aria-hidden="true">
      <svg
        viewBox="0 0 200 40"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={tone.stroke} stopOpacity="0.22" />
            <stop offset="100%" stopColor={tone.stroke} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={lineId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={tone.stroke} stopOpacity="0" />
            <stop offset="55%"  stopColor={tone.stroke} stopOpacity="1" />
            <stop offset="100%" stopColor={tone.stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Soft volume below the curve */}
        <path d={`${CURVE} L 200 40 L 0 40 Z`} fill={`url(#${fillId})`} />

        {/* Ghost baseline */}
        <path d={CURVE} stroke={tone.stroke} strokeOpacity="0.22" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* Animated signal segment */}
        <path
          d={CURVE}
          stroke={`url(#${lineId})`}
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="22 78"
          className="animate-trail"
        />
      </svg>

      {/* Live indicator dot */}
      <span
        className={`absolute right-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full ${tone.dot} animate-pulse-slow`}
        style={{ boxShadow: `0 0 8px ${tone.dotGlow}` }}
      />
    </div>
  );
}

export function OverviewCard({
  label,
  value,
  icon: Icon,
  color = "slate",
  series,
}) {
  const tone = TONE[color] || TONE.slate;

  return (
    <div
      className={`group relative h-[7rem] min-w-[12.5rem] flex flex-col overflow-hidden
                  rounded-lg border ${tone.ring} bg-card/60 backdrop-blur-sm
                  shadow-[0_8px_30px_rgba(0,0,0,0.45)] ${tone.glow}
                  transition-colors duration-200 hover:bg-card/80 hover:border-opacity-70`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tone.tint}`} />

      <div className="relative p-3 flex flex-col justify-between h-full">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300/90 whitespace-nowrap">
            {label}
          </p>
          {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${tone.icon}`} aria-hidden="true" />}
        </div>

        <div className="text-2xl font-bold font-mono-nums text-white leading-none">
          {value ?? "—"}
        </div>

        {Array.isArray(series) && series.length > 0 ? (
          <StatSparkline data={series} />
        ) : (
          <PulseTrail tone={tone} />
        )}
      </div>
    </div>
  );
}
