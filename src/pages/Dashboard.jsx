import { OverviewCard } from '@/components/OverviewCard';
import { AgentsTable } from '@/components/AgentsTable';
import { CallStatusChart } from '@/components/CallStatusChart';
import { UtilizationChart } from '@/components/UtilizationChart';
import { Users, Headphones, Clock, PhoneIncoming, PauseCircle, Phone, Loader} from 'lucide-react';
// import { useDispatch ,useSelector} from 'react-redux';
// import {
//   fetchOverview,
//   fetchAgentsOnCalls,
//   fetchAgentPerformance,
//   fetchCallStatus,
//   fetchAllData
// } from '@/slices/dashboardSlice';
// import { useEffect } from 'react';
import { ComplianceStats} from '../components/ComplianceStats';
import { useGetAgentsProductivityQuery, useGetAllDataQuery, useGetCallStatusQuery, useGetCampaignPerformanceQuery, useGetCompliancereviewQuery, useGetDialerPerformanceQuery, useGetGraphDataQuery, useGetHourlyPerformanceQuery, useGetLeadfunnelQuery } from '../services/dashboardApi';
// import CallsAgentsOverview from '../components/CallsAgentsOverview';
import TotalDialsToday from '../components/TotalDialsToday';
import DialerPerformance from '../components/DialerPerformance';
import { CampaignPerformance } from '../components/CampaignPerformance';
import HourlyPerformanceHeatmap from '../components/HourlyPerformance';
import { LeadFunnel } from '../components/LeadFunnel';
export default function Dashboard() {
 

    // const { data:overview,  isLoading: overviewLoading} = useGetOverviewQuery(undefined, {
    //   pollingInterval:  30000,
    //   skipPollingIfUnfocused: true,
    // });

  

  const { data: campaignPerformance = [] } =
  useGetCampaignPerformanceQuery(undefined, {
      pollingInterval:  30000,
      skipPollingIfUnfocused: true,
    });

  const { data: callStatus ,isLoading:CallStatusLoading } =
    useGetCallStatusQuery(undefined, {
      pollingInterval:  30000,
      skipPollingIfUnfocused: true,
    });

  // const { data: allData } =
  //   useGetAllDataQuery(undefined, {
  //     pollingInterval:  30000,
  //     skipPollingIfUnfocused: true,
  //   });
  const { data: dialerPerformance ,isLoading:dialerPerformanceLoading} =
  useGetDialerPerformanceQuery(undefined, {
      pollingInterval:  30000,
      skipPollingIfUnfocused: true,
    });
  const { data: hourlyPerformanceData } =
  useGetHourlyPerformanceQuery(undefined, {
      pollingInterval:  30000,
      skipPollingIfUnfocused: true,
    });
  const { data: graphData ,isLoading:graphDataLoading} =
  useGetGraphDataQuery(undefined, {
      pollingInterval:  30000,
      skipPollingIfUnfocused: true,
    });
  const { data: ComplianceData } =
  useGetCompliancereviewQuery(undefined, {
      pollingInterval:  30000,
      skipPollingIfUnfocused: true,
    });
  
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

    {/* LEFT COLUMN */}
    <div className="lg:col-span-2 space-y-4">

      {/* CALLS & AGENTS OVERVIEW */}
      {/* <CallsAgentsOverview overview={overview.data} /> */}
<TotalDialsToday/>
      {/* TABLES STACK NATURALLY ON MOBILE */}
      <div className="flex flex-col lg:flex-row gap-4">
    <div className="lg:w-1/3 h-100% ">
      <DialerPerformance data={dialerPerformance} graphData={graphData} isLoading={dialerPerformanceLoading} isGraphDataLoading={graphDataLoading}/>
    </div>
    <div className="lg:w-2/3 h-100%">
      <AgentsTable />
    </div>
  </div>
      <CampaignPerformance data={campaignPerformance}  />
      {/* <ComplianceStats allData={ComplianceData?.data[0]} /> */}
    </div>

    {/* RIGHT COLUMN */}
    <div className="space-y-4">
<LeadFunnel />
      {/* CALL STATUS */}
      <div className="p-2 border border-border rounded-lg bg-card/60">
        <div className="flex justify-between items-center m-2 lg:mb-4">
            <h3 className="text-xl leading-[1rem] font-semibold text-white flex items-center gap-2">
              Calls by Status
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Distribution across Active / Ringing / IVR
            </p>
        </div>

        <CallStatusChart callStatus={callStatus} CallStatusLoading={CallStatusLoading}/>

       {callStatus && !CallStatusLoading &&( <div className="mt-0 flex justify-between text-sm border-t border-slate-700 p-2 pb-0">
          <span className="text-slate-300">Total Calls</span>
          <span className="font-mono text-white font-semibold">
            {callStatus.data[0].Totalcall || 0}
          </span>
        </div>)}
      </div>

      {/* DIALER HEALTH */}
      <HourlyPerformanceHeatmap  data ={hourlyPerformanceData}/>

    </div>
    {/* <div className="flex flex-col lg:flex-row gap-4 lg:col-span-3">
  
  <div className="lg:basis-[48%]">
  <ComplianceStats allData={allData} />
  </div>

  
  <div className="lg:basis-[52%]">
    <ComplianceStats allData={allData} />
  </div>
</div> */}
  </div>
  );
}
