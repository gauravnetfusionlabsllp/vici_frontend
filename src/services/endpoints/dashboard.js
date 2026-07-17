import { dashboardApi } from '../api';

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
      query: () => '/metalead-stats',
      providesTags: ['Dashboard', 'DATE_FILTERED'],
      keepUnusedDataFor: 60,
      extraOptions: { maxRetries: 3, withDate: true },
    }),
  }),
});
