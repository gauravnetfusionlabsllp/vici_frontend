import React from 'react'
import { OverviewCard } from './OverviewCard'
import { Users, Headphones, Clock, PhoneIncoming, PauseCircle, Phone, Loader} from 'lucide-react';
const CallsAgentsOverview = ({overview}) => {
    const {active_users ,ringing_calls,waiting_calls,calls_in_ivr,agents_logged_in,agents_in_calls,
        agents_waiting,paused_agents
      } = overview;
  return (

          <div className="border border-slate-800 rounded-lg p-4 sm:p-6 bg-slate-900/30">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl leading-tight font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Calls & Agents Overview
              </h2>
            </div>

            {/* ✅ RESPONSIVE CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
              <OverviewCard label="Active Users" value={active_users} icon={Phone} trend="+3.2%" trendDesc="vs last 5 min" color="blue" />
              <OverviewCard label="Calls Ringing" value={ringing_calls} icon={PhoneIncoming} trend="+16%" trendDesc="vs avg" color="blue" />
              <OverviewCard label="Calls Waiting for Agents" value={waiting_calls} icon={Clock} trend="queue" trendDesc="" color="amber" />
              <OverviewCard label="Calls in IVR" value={calls_in_ivr} icon={Clock} trend="stable" trendDesc="" color="slate" />
              <OverviewCard label="Agents Logged In" value={agents_logged_in} icon={Users} trend="total seats" trendDesc="" color="blue" />
              <OverviewCard label="Agents in Calls" value={agents_in_calls} icon={Headphones} trend="handling customers" trendDesc="" color="blue" />
              <OverviewCard label="Agents Waiting" value={agents_waiting} icon={Users} trend="idle & ready" trendDesc="" color="blue" />
              <OverviewCard label="Agents Paused" value={paused_agents} icon={PauseCircle} trend="break / wrap-up" trendDesc="" color="slate" />
            </div>
          </div>
  )
}

export default CallsAgentsOverview
