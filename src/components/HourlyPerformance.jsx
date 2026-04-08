import React from "react";
import ReactECharts from "echarts-for-react";

/**
 * Example API data (can have any number of keys)
 */
const apiData = {
  hours: [9, 10, 11, 12, 13, 14],
  total_calls: [9, 337, 112, 200, 150, 300],
  connected_calls: [5, 260, 87, 190, 120, 280],
  failed_calls: [4, 77, 25, 10, 30, 20],
//   waiting_calls: [4, 77, 25, 10, 30, 20],
//   cut: [4, 77, 25, 10, 30, 20],
};

function transformToHeatmap(data) {
  const hours = data.hours;
  const metrics = Object.keys(data).filter((k) => k !== "hours");

  const seriesData = [];

  metrics.forEach((metric, yIndex) => {
    data[metric].forEach((value, xIndex) => {
      seriesData.push([xIndex, yIndex, value]);
    });
  });

  return { hours, metrics, seriesData };
}



export default function HourlyPerformanceHeatmap({data,isLoading}) {
    return (
        <div className="p-2 border border-border rounded-lg bg-card/60">
          
          <div className="flex justify-between items-center m-2 lg:mb-4">
            <h3 className="text-xl leading-[1rem] font-semibold text-white flex items-center gap-2">
              Hourly Performance
            </h3>
          </div>
    
          <HeatmapChart data={data} isLoading={isLoading}/>
        </div>
      );}
function HeatmapChart({data,isLoading}) {

    if (isLoading) {
        return <LoadingState />
      }
    
      if (!data?.hours.length) {
        return <EmptyState />
      }
  const { hours, metrics, seriesData } = transformToHeatmap(data || apiData);

  // Dynamic row height calculation
  const maxRowHeight = 40; // max height per row
  const minRowHeight = 20; // min height per row
  const rowHeight = Math.min(maxRowHeight, Math.max(minRowHeight, 320 / metrics.length)); // scale based on container

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      position: "top",
      formatter: ({ value }) => {
        const [x, y, v] = value;
        return `${metrics[y]}<br/>Hour: ${hours[x]}<br/>Value: ${v}`;
      },
    },
    grid: {
      top: 20,
      left: 0,
      right: 50,
      bottom: 0,
      containLabel: true,
      height: rowHeight * metrics.length,
    },
    xAxis: {
      type: "category",
      data: hours.map((h) => `${h}:00`),
      axisLine: { lineStyle: { color: "#334155" } },
      axisLabel: { color: "#94a3b8" },
      splitArea: { show: true },
    },
    yAxis: {
      type: "category",
      data: metrics.map((m) => m.replace(/_calls/g, " ").toUpperCase()),
      axisLine: { lineStyle: { color: "#334155" } },
      axisLabel: { color: "#94a3b8" },
      splitArea: { show: true },
    },
    visualMap: {
      min: 0,
      max: Math.max(...seriesData.map((d) => d[2])),
      calculable: true,
      orient: "vertical",
      left: "right",
      right:"0",
      top: "0",
    //   bottom: "auto",
      inRange: {
        color: ["#091E23", "#1B838A", "#28A4A1"],
      },
      textStyle: { color: "#94a3b8" },
    },
    series: [
      {
        name: "Hourly Performance",
        type: "heatmap",
        data: seriesData,
        label: {
          show: true,
          color: "#e5e7eb",
          fontSize: 11,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(34,211,238,0.6)",
          },
        },
        itemStyle: {
          borderWidth: 1,
          borderColor: "#0b1220",
        },
      },
    ],
  };

  return (
    

      <ReactECharts
        option={option}
        style={{ height: Math.max(180, rowHeight * metrics.length + 50), width: "100%" }}
        opts={{ renderer: "canvas" }}
        notMerge={true}
        lazyUpdate={true}
      />
  );
}
function LoadingState() {
    return (
      <div className="h-full rounded-xl bg-card/60 p-4 flex items-center justify-center text-gray-400">
        Loading Hourly Performance…
      </div>
    )
  }
  
  function EmptyState() {
    return (
      <div className="h-full rounded-xl bg-card/60 p-4 flex items-center justify-center text-gray-400">
        No Hourly Performance Data
      </div>
    )
  }