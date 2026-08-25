import { dashboardApi } from '../api';

// What "called" means for META leads, app-wide. 'lead' = the lead ROW carries a dial:
// vicidial_list joined to vicidial_log on lead_id — the same test the agent queue dials
// on, from the other side (it hands out leads whose lead_id has NO log row), so a lead
// counted pending here is exactly a lead an agent can still be given.
// Not 'status' (vicidial_list.status left 'NEW'), which undercounts: a dial ending
// INVN/no-answer can leave the lead row at 'NEW' (~1,650 such leads system-wide).
// Not 'log' either — that matches on the phone, so a dial whose lead row is gone still
// counts. Every caller sends this unless it overrides.
export const CALLED_BASIS = 'lead';

export const {
  useGetTotalDialsTodayQuery,
  useGetCallStatusQuery,
  useGetAllDataQuery,
  useGetAgentsProductivityQuery,
  useGetCampaignPerformanceQuery,
  useGetDialerPerformanceQuery,
  useGetHourlyPerformanceQuery,
  useGetGraphDataQuery,
  useGetCompliancereviewQuery,
  useGetLeadfunnelQuery,
  useGetRnrTiersQuery,
  useGetMetaLeadStatsQuery,
  useGetMetaLeadIbSplitQuery,
  useGetMetaLeadIbAttemptsQuery,
} = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    getTotalDialsToday: builder.query({
      query: () => '/totaldialstoday',
      providesTags: ['Dashboard', 'DATE_FILTERED', 'CAMPAIGN_FILTERED', 'USERNAME_FILTERED'],
      keepUnusedDataFor: 60,
      extraOptions: { maxRetries: 3, withDate: true, withCampaign: true, withUsername: true },
    }),
    getCallStatus: builder.query({
      query: () => '/getcallbystatus',
      providesTags: ['Dashboard', 'DATE_FILTERED', 'CAMPAIGN_FILTERED', 'USERNAME_FILTERED'],
      extraOptions: { maxRetries: 3, withDate: true, withCampaign: true, withUsername: true },
    }),
    getAllData: builder.query({
      query: () => '/get_all_data',
      providesTags: ['Dashboard'],
    }),
    getAgentsProductivity: builder.query({
      query: () => '/agentsproductivity',
      providesTags: ['Dashboard', 'DATE_FILTERED', 'CAMPAIGN_FILTERED'],
      extraOptions: { maxRetries: 3, withDate: true, withCampaign: true },
    }),
    getCampaignPerformance: builder.query({
      query: () => '/campaignperformance',
      providesTags: ['Dashboard', 'DATE_FILTERED', 'USERNAME_FILTERED'],
      extraOptions: { maxRetries: 3, withDate: true, withUsername: true },
    }),
    getDialerPerformance: builder.query({
      query: () => '/dialerperformance',
      providesTags: ['Dashboard', 'DATE_FILTERED', 'CAMPAIGN_FILTERED', 'USERNAME_FILTERED'],
      extraOptions: { maxRetries: 3, withDate: true, withCampaign: true, withUsername: true },
    }),
    getHourlyPerformance: builder.query({
      query: () => '/hourlyperformance',
      providesTags: ['Dashboard'],
    }),
    getGraphData: builder.query({
      query: () => '/graphdata',
      providesTags: ['Dashboard'],
    }),
    getCompliancereview: builder.query({
      query: () => '/compliancereview',
      providesTags: ['Dashboard'],
    }),
    getLeadfunnel: builder.query({
      query: () => '/leadfunnel',
      providesTags: ['Dashboard', 'DATE_FILTERED', 'CAMPAIGN_FILTERED', 'USERNAME_FILTERED'],
      extraOptions: { maxRetries: 3, withDate: true, withCampaign: true, withUsername: true },
    }),
    getRnrTiers: builder.query({
      query: () => '/rnrtiers',
      providesTags: ['Dashboard', 'DATE_FILTERED', 'CAMPAIGN_FILTERED', 'USERNAME_FILTERED'],
      extraOptions: { maxRetries: 3, withDate: true, withCampaign: true, withUsername: true },
    }),
    getMetaLeadStats: builder.query({
      // arg: { ib } — 'all' (default) | 'ib' | 'non_ib'. The top-level totals follow
      // the filter; `breakdown` carries both sides either way, so the dashboard KPIs
      // (which pass no arg) are unaffected. `basis` defaults to CALLED_BASIS so these
      // KPIs agree with the META section, which reports the same cohort.
      query: (arg) => {
        const params = new URLSearchParams();
        if (arg?.ib && arg.ib !== 'all') params.set('ib', arg.ib);
        params.set('basis', arg?.basis || CALLED_BASIS);
        return `/metalead-stats?${params.toString()}`;
      },
      providesTags: ['Dashboard', 'DATE_FILTERED'],
      keepUnusedDataFor: 60,
      extraOptions: { maxRetries: 3, withDate: true },
    }),
    // Purpose-built for the "Leads — IB vs Non-IB" panel (api/routers/dashboard.py
    // → /metalead-ib-split). Returns the cohort funnel plus both sides already cut,
    // labelled and reduced to percentages, so the panel renders what the server
    // counted instead of redoing the arithmetic per tile.
    //
    // Pinned to an explicit date range, not the dashboard date picker: `withDate` is
    // deliberately OFF (it would append a second sd/ed pair) and DATE_FILTERED is not
    // claimed, so moving the picker neither rewrites nor invalidates this cohort.
    getMetaLeadIbSplit: builder.query({
      // `basis` picks what "called" means: 'lead' (app-wide default — the lead row
      // carries a dial), 'log' (the phone was dialed inside the window) or 'status'
      // (vicidial_list.status moved off 'NEW'). See the endpoint docstring.
      query: ({ sd, ed, basis } = {}) => {
        const params = new URLSearchParams();
        if (sd) params.set('sd', sd);
        if (ed) params.set('ed', ed);
        params.set('basis', basis || CALLED_BASIS);
        const qs = params.toString();
        return `/metalead-ib-split${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Dashboard'],
      keepUnusedDataFor: 300,
      extraOptions: { maxRetries: 3 },
    }),
    // Dial-count distribution (1x / 2x / 3x / 4+) per distinct META number, from
    // vicidial_log (api/routers/dashboard.py → /metalead-ib-attempts). Number-grain
    // companion to getMetaLeadIbSplit: same cohort, same form-name IB rule, same
    // blank-address1 exclusion, so the two panels describe one body of leads.
    // Same fixed-range contract too: explicit sd, no `withDate`, no DATE_FILTERED.
    getMetaLeadIbAttempts: builder.query({
      query: ({ sd, ed } = {}) => {
        const params = new URLSearchParams();
        if (sd) params.set('sd', sd);
        if (ed) params.set('ed', ed);
        const qs = params.toString();
        return `/metalead-ib-attempts${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Dashboard'],
      keepUnusedDataFor: 300,
      extraOptions: { maxRetries: 3 },
    }),
  }),
});
