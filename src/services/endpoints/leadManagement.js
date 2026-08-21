import { dashboardApi } from '../api';

import { ibParam } from './ib';

export const { useGetMetaLeadsQuery } = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    getMetaLeads: builder.query({
      // arg: { ib } — 'all' (default) | 'ib' | 'non_ib'. The server filters on the
      // VICIdial list the lead was routed into and stamps each row with `is_ib`, so the
      // rows here and the /metalead-stats funnel always cover the same cohort.
      query: (arg) => `/lead-management-system/meta-leads${ibParam(arg?.ib)}`,
      transformResponse: (res) => res?.data ?? [],
      providesTags: ['DATE_FILTERED'],
      extraOptions: { maxRetries: 3, withDate: true },
    }),
  }),
});
