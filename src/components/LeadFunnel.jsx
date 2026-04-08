import React, { useMemo, useState } from "react"

import { TrendingDown } from "lucide-react"
import { useGetLeadfunnelQuery } from "../services/dashboardApi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


export function LeadFunnel() {
    // const today = new Date()

    // const [startDate, setStartDate] = useState(new Date());
    // const [endDate, setEndDate] = useState(new Date());
    // const shouldSendParams =
    // startDate.toDateString() !== today.toDateString() ||
    // endDate.toDateString() !== today.toDateString();
    const { data: LeadFunnelData } = useGetLeadfunnelQuery(undefined,
        // shouldSendParams
        //   ? {
        //       sd: startDate.toISOString().split("T")[0],
        //       ed: endDate.toISOString().split("T")[0],
        //     }
        //   : undefined,
        {
          pollingInterval: 30000,
          skipPollingIfUnfocused: true,
        }
      );

  let data = LeadFunnelData?.data ?? {}

  const num = (v) => (Number.isFinite(+v) ? +v : 0)

  const dialed = num(data.dialed)
  const connected = num(data.connected)
  const interested = num(data.Interested)
  const converted = num(data.converted)


  // Calculate percentages and conversions
  const safePercent = (value, total, decimals = 1) =>
    total > 0 ? `${((value / total) * 100).toFixed(decimals)}%` : "0%";
  
  const safeDrop = (value, total, decimals = 1) =>
    total > 0 ? `${(100 - (value / total) * 100).toFixed(decimals)}%` : "0%";
  
  const format = (v) => num(v).toLocaleString()
  const stages = useMemo(
    () =>[
    {
      label: "DIALED",
      subLabel: `${dialed}`,
      value: dialed,
      percentage: "100%",
      metric: "DIALED",
      width: 85,
      drop: null,
    },
    {
        label: "CONNECTED",
        subLabel: `${connected}`,
        value: connected,
        percentage: safePercent(connected, dialed, 0),
        metric: "CONNECTED",
        width: 70,
        drop: safeDrop(connected, dialed, 0),
      },
    {
      label: "INTERESTED",
      subLabel: `${interested}`,
      value: interested,
      percentage: safePercent(interested, dialed),
      metric: "INTERESTED",
      width: 58,
      drop: safeDrop(interested, dialed),
    },
  
    
  
    
  
    {
      label: "CONVERTED",
      subLabel: `${converted}`,
      value: converted,
      percentage: safePercent(converted, interested, 0),
      metric: "CONVERTED",
      width: 48,
      drop: safeDrop(converted, interested, 0),
    },
    // {
    //     label: "QUALIFIED",
    //     subLabel: `${qualified}`,
    //     value: qualified,
    //     percentage: safePercent(qualified, converted, 0),
    //     metric: "Conversion",
    //     width: 50,
    //     drop: safeDrop(qualified, converted, 0),
    //   },
  ],
  [dialed, connected, interested, converted]
)

  return (
    <div className="p-2 border border-border rounded-lg bg-card/60">
      <div className="flex flex-col  justify-between m-2 lg:mb-2">
  <div className="flex justify-between">
    <h3 className="text-xl font-semibold text-white">Lead Funnel</h3>
    {/* <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-slate-400">From:</span>
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          maxDate={endDate||today} // cannot select future dates
          className="bg-input border border-border text-foreground text-sm rounded px-2 py-1 w-24"
          popperClassName="z-50 dark-datepicker"
        />

        <span className="text-sm text-slate-400">To:</span>
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
          popperPlacement="bottom-start"
          
          maxDate={today} // cannot select future dates
          popperClassName="z-50 dark-datepicker"
          className="bg-input border border-border text-foreground text-sm rounded px-2 py-1 w-24"
        />
      </div> */}
  </div>

  {/* Date Filters */}
  
<p className="text-sm text-slate-500">
      Leads handled across selected duration
    </p>
</div>

      <div className="relative flex flex-col items-center gap-0 mt-2 px-4">
        {stages.map((stage, index) => (
          <div key={stage.label} className="relative w-full flex items-center justify-center mb-2">
            {/* Left Label */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-left w-20">
              <div className="text-xs uppercase tracking-wider">{stage.label}</div>
              <div className="text-xs text-slate-400">{stage.subLabel}</div>
            </div>

            {/* Funnel Stage */}
            <div className="relative flex items-center justify-center h-12" style={{ width: `${stage.width}%` }}>
              {/* Trapezoid Shape using clip-path */}
              <div
                className="absolute inset-0 bg-gradient-to-b from-[#1e3a5f] to-[#0d2847] border-t  border-b border-slate-600/40 "
                style={{
                  clipPath:
                    index === stages.length - 1
                      ? "polygon(11% 0%, 89% 0%, 82% 100%, 20% 100%)" 
                      : "polygon(10% 0%, 90% 0%, 84% 100%, 16% 100%)",
                      
                }}
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-white">{format(stage.value)}</div>
                <div className="text-xs text-cyan-400">
                  {stage.percentage} <span className="text-slate-500">{stage.metric}</span>
                </div>
              </div>

              {/* Connector Dot */}
              {/* {index < stages.length - 1 && (
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-500 rounded-full z-20" />
              )} */}
            </div>

            {/* Right Drop Percentage */}
            {stage.drop && (
  <div
    className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1 text-red-400 text-sm"
    style={{
      left: `${(100 + stage.width) / 2.1}%`,
      transform: "translate(0px, -50%)",
    }}
  >
    <TrendingDown className="w-3 h-3" />
    <span>{stage.drop}</span>
  </div>
)}
          </div>
        ))}

        {/* Bottom Icon */}
        {/* <div className="mt-0 flex items-center gap-3">
          <div className="w-20 h-4 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center">
            <div className="w-10 h-2 rounded-full bg-slate-700 flex items-center justify-center">
              <div className="w-4 h-1 bg-cyan-400 rounded-full" />
            </div>
          </div>
        </div> */}
      </div>
    </div>
  )
}
