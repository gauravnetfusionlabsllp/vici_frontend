import { dashboardApi } from '../api';

export const {
  useLoginMutation,
  useRefreshMutation,
  useGetCampaignsQuery,
  useVicidialReloginMutation,
  useVicidialLogoutMutation,
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
    vicidialRelogin: builder.mutation({
      query: () => ({ url: '/vicidial-relogin', method: 'POST' }),
    }),
    vicidialLogout: builder.mutation({
      query: () => ({ url: '/vicidial-logout', method: 'POST' }),
    }),
  }),
});
