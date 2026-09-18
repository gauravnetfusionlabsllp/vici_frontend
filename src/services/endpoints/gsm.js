import { dashboardApi } from '../api';

// Live SIM / trunk status pulled from the Yeastar GSM gateways
// (backend: api/routers/gsm_gateways.py). The page polls this on an interval.
export const {
  useGetGsmStatusQuery,
  useGetGsmSummaryQuery,
} = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    // Full snapshot: every gateway with its per-port SIM list + aggregate totals.
    getGsmStatus: builder.query({
      query: ({ force } = {}) => ({
        url: '/gsm/status',
        params: force ? { force: true } : {},
      }),
      providesTags: [{ type: 'Gsm', id: 'STATUS' }],
    }),

    // Headline counts only (no per-port list) — cheap for a small widget.
    getGsmSummary: builder.query({
      query: () => ({ url: '/gsm/summary' }),
      providesTags: [{ type: 'Gsm', id: 'SUMMARY' }],
    }),
  }),
});
