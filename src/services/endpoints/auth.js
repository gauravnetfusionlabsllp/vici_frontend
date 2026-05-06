import { dashboardApi } from '../api';

export const {
  useLoginMutation,
  useRefreshMutation,
  useGetCampaignsQuery,
} = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (body) => ({ url: '/login', method: 'POST', body }),
    }),
    refresh: builder.mutation({
      query: (body) => ({ url: '/refresh', method: 'POST', body }),
    }),
    getCampaigns: builder.query({
      query: (username) => ({
        url: '/campaigns',
        params: username ? { username } : {},
      }),
    }),
  }),
});
