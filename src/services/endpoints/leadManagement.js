import { dashboardApi } from '../api';

import { ibParam } from './ib';

export const { useGetMetaLeadsQuery } = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    getMetaLeads: builder.query({
      // arg: { ib } — 'all' (default) | 'ib' | 'non_ib'. The server filters on the FORM
      // NAME the lead is filed under (VICIdial address1 containing "ib") and stamps each
      // row with `is_ib`, so these rows and the dashboard's IB panels cover one cohort.
      query: (arg) => `/lead-management-system/meta-leads${ibParam(arg?.ib)}`,
      transformResponse: (res) => res?.data ?? [],
      providesTags: ['DATE_FILTERED'],
      extraOptions: { maxRetries: 3, withDate: true },
    }),
  }),
});
