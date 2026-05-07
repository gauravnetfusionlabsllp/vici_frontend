import React, { useEffect, useState } from 'react';
import { Users, Headphones, Clock, PhoneIncoming, PauseCircle, Phone, Loader } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';

import { OverviewCard } from '@/features/dashboard/components/OverviewCard';
import { useGetMetaLeadStatsQuery, useGetTotalDialsTodayQuery } from '@/services';
import { selectIsAdmin } from '@/features/auth/slices/authSlice';
import { togglePause } from '@/features/calls/slices/dialSlice';
import { SkeletonOverviewCard } from '@/shared/components/ui';

const TotalDialsToday = ({ overview }) => {
  const isAdmin = useSelector(selectIsAdmin);
  const { data: TodaysDialsData, isLoading } = useGetTotalDialsTodayQuery(undefined, {
    pollingInterval: 30000,
    skipPollingIfUnfocused: true,
  });
  const { data: metaLeadData, isLoading: metaLoading } =
  useGetMetaLeadStatsQuery(undefined, {
    pollingInterval: 30000,
    skipPollingIfUnfocused: true,
  });
  const location = useLocation();
  const isCallPage = location.pathname === "/call";
  const dispatch = useDispatch();

  const { isPaused } = useSelector(e => e.dial);

  const {
    total_dials,
    connected_calls,
    connection_rate_pct,
    total_talk_time,
    avg_talk_time_sec,
    leads_connected,
  } = TodaysDialsData?.data?.[0] || {};
  const {
    total_leads,
    called_leads,
    pending_leads,
  } = metaLeadData || {};

  const kpis = [
    { label: 'Total Dials Today', value: total_dials, icon: PhoneIncoming, trend: '+16%', color: 'blue' },
    { label: 'Connected Calls', value: connected_calls, icon: Clock, trend: 'queue', color: 'amber' },
    { label: 'Connection Rate(%)', value: connection_rate_pct, icon: Clock, trend: 'stable', color: 'slate' },
    { label: 'Total Talk Time', value: total_talk_time, icon: Users, trend: 'total seats', color: 'blue' },
    { label: 'Avg Talk Time Sec', value: avg_talk_time_sec, icon: Headphones, trend: 'handling customers', color: 'blue' },
    { label: 'Total META Leads', value: total_leads, icon: Users, trend: 'meta', color: 'blue' },
    { label: 'Called META Leads', value: called_leads, icon: Phone, trend: 'progress', color: 'green' },
    { label: 'Pending META Leads', value: pending_leads, icon: PauseCircle, trend: 'remaining', color: 'red' },
  ];
  const isBusy = isLoading || metaLoading;

  return (
    <div
      className={
        isCallPage
          ? `relative overflow-hidden rounded-2xl border border-white/10
           bg-gradient-to-b from-slate-900/70 to-slate-950/80
           shadow-[0_30px_120px_rgba(0,0,0,0.55)]
           p-2 max-w-[1440px] animate-fade-in-up`
          : `p-2 max-w-[1440px] border border-border rounded-lg bg-card/60 animate-fade-in-up`
      }
    >
      {isCallPage && (
        <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(700px_circle_at_15%_0%,rgba(56,189,248,0.16),transparent_55%),radial-gradient(700px_circle_at_90%_10%,rgba(168,85,247,0.14),transparent_55%)]" />
      )}

      <div className="relative">
        <div className="flex justify-between items-center m-2 lg:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            Total Dials Today
          </h2>
          {!isAdmin && (
            <div className='flex gap-2 items-center' >
              <button
              onClick={() => dispatch(togglePause())}
              className={[
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold",
                "border transition-all duration-200 backdrop-blur",
                "shadow-[0_10px_30px_rgba(0,0,0,0.45)]",
                isPaused
                  ? "border-emerald-500/40 bg-emerald-600/20 text-emerald-200 " +
                  "hover:bg-emerald-600/30 hover:text-emerald-100 active:bg-emerald-600/40"
                  : "border-amber-500/40 bg-amber-600/20 text-amber-200 " +
                  "hover:bg-amber-600/30 hover:text-amber-100 active:bg-amber-600/40",
              ].join(" ")}
              title={isPaused ? "Resume receiving calls" : "Pause receiving calls"}
            >
              {isPaused ? (
                <>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  RESUME
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                    <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
                  </svg>
                  PAUSE
                </>
              )}
            </button>
            </div>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto h-32 scrollbar-thin scrollbar-auto-hide stagger-children">
          {isBusy
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonOverviewCard key={i} />)
            : kpis.map(({ label, value, icon, trend, color }) => (
                <OverviewCard
                  key={label}
                  label={label}
                  value={value}
                  icon={icon}
                  trend={trend}
                  color={color}
                />
              ))}
        </div>
      </div>
    </div>
  );
};

export default TotalDialsToday;
