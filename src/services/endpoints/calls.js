import { dashboardApi } from '../api';

export const {
  useDialNextMutation,
  useCallHangupMutation,
  useGetLogDataQuery,
  useSubmitStatusMutation,
  usePingQuery,
  useUserTimelineQuery,
  useStatusDataQuery,
  useSendMessageMutation,
} = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    dialNext: builder.mutation({
      query: (params = {}) => ({
        url: '/call',
        method: 'POST',
        params: Object.keys(params).length ? params : undefined,
      }),
    }),
    callHangup: builder.mutation({
      query: () => ({ url: '/hangup', method: 'POST' }),
    }),
    getLogData: builder.query({
      query: (user) => ({ url: '/logdata', method: 'POST', params: { user } }),
    }),
    submitStatus: builder.mutation({
      query: (params = {}) => ({
        url: '/submit_status',
        method: 'POST',
        params: Object.keys(params).length ? params : undefined,
      }),
    }),
    ping: builder.query({
      query: () => '/ping',
    }),
    userTimeline: builder.query({
      query: () => '/usertimeline',
    }),
    statusData: builder.query({
      query: () => '/status_data',
    }),
    sendMessage: builder.mutation({
      query: (phone) => ({
        url: '/send-sms',
        method: 'POST',
        body: { phone_number: phone },
      }),
      invalidatesTags: ['Leads'],
    }),
  }),
});
