import { StatSparkline } from "./SparkLineChart";

export function OverviewCard({
  label,
  value,
  icon: Icon,
  trend,
  trendDesc,
  color,
}) {
  const colorClasses = {
    blue: "border-blue-500/30 bg-blue-500/5",
    amber: "border-amber-500/30 bg-amber-500/5",
    slate: "border-slate-600/30 bg-slate-500/5",
  };

  const iconColorClasses = {
    blue: "text-blue-400",
    amber: "text-amber-400",
    slate: "text-slate-400",
  };
  const totalDialsData = [
    { value: 120 },
    { value: 180 },
    { value: 160 },
    { value: 220 },
    { value: 210 },
    { value: 260 },
    { value: 300 },
    { value: 280 },
  ];
  return (
    <div className={`h-[7rem] min-w-[12.5rem] flex flex-col border border-border rounded-md bg-card/60 shadow-[0_8px_30px_rgba(0,0,0,0.45)]`}>
     
          <div className="p-1 m-2">
            <p className="text-xs mt-1 font-semibold text-slate-300 uppercase text-nowrap display-block">
              {label}
            </p>

            <div className="text-xl font-bold font-mono text-white mt-1">
              {value}
            </div>
            <StatSparkline data={totalDialsData} />
          </div>
    </div>
  );
}
