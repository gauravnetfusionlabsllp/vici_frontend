import { OverviewCard } from './components/OverviewCard';
import { AgentsTable } from './components/AgentsTable';
import { CallStatusChart } from './components/CallStatusChart';
import { UtilizationChart } from './components/UtilizationChart';
import { Users, Headphones, Clock, PhoneIncoming, PauseCircle, Phone, Loader} from 'lucide-react';
import { ComplianceStats} from './components/ComplianceStats';
import { useGetAgentsProductivityQuery, useGetAllDataQuery, useGetCallStatusQuery, useGetCampaignPerformanceQuery, useGetCompliancereviewQuery, useGetDialerPerformanceQuery, useGetGraphDataQuery, useGetHourlyPerformanceQuery, useGetLeadfunnelQuery } from '@/services';
import TotalDialsToday from '@/shared/components/TotalDialsToday';
import DialerPerformance from './components/DialerPerformance';
import { CampaignPerformance } from './components/CampaignPerformance';
import HourlyPerformanceHeatmap from './components/HourlyPerformance';
import { LeadFunnel } from './components/LeadFunnel';
import { RnrTierFunnel } from './components/RnrTierFunnel';
import { MetaLeadSplit } from './components/MetaLeadSplit';
import { CallAttemptChart } from './components/CallAttemptChart';

export default function DashboardPage() {
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
    <div className="lg:col-span-2 space-y-4 stagger-children">
      <TotalDialsToday/>
      <MetaLeadSplit/>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-1/3 h-100%">
          <DialerPerformance data={dialerPerformance} graphData={graphData} isLoading={dialerPerformanceLoading} isGraphDataLoading={graphDataLoading}/>
        </div>
        <div className="lg:w-2/3 h-100%">
          <AgentsTable />
        </div>
      </div>
      <CampaignPerformance data={campaignPerformance} />
    </div>

    {/* RIGHT COLUMN */}
    <div className="flex flex-col gap-4 stagger-children">
      <div className="flex-1 flex flex-col min-h-0">
        <LeadFunnel />
      </div>
      <CallAttemptChart />
      {/* <RnrTierFunnel /> */}
      <div className="p-2 border border-border rounded-lg bg-card/60 transition-smooth">
        <div className="flex justify-between items-center m-2 lg:mb-4">
            <h3 className="text-xl leading-[1rem] font-semibold text-white flex items-center gap-2">
              Calls by Status
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Distribution across Active / Ringing / IVR
            </p>
        </div>

        <CallStatusChart callStatus={callStatus} CallStatusLoading={CallStatusLoading}/>

       {callStatus && !CallStatusLoading &&( <div className="mt-0 flex justify-between text-sm border-t border-slate-700 p-2 pb-0 animate-fade-in">
          <span className="text-slate-300">Total Calls</span>
          <span className="font-mono text-white font-semibold">
            {callStatus.data[0].Totalcall || 0}
          </span>
        </div>)}
      </div>

      <HourlyPerformanceHeatmap data={hourlyPerformanceData}/>

    </div>
  </div>
  );
}
