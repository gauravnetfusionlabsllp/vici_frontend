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
  useCallStatusQuery,
  useLazyCallStatusQuery,
  useStringeeClientEventMutation,
  useStringeeClientTokenMutation,
} = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    dialNext: builder.mutation({
      query: (params = {}) => ({
        url: '/call',
        method: 'POST',
        params: Object.keys(params).length ? params : undefined,
      }),
    }),
    // params is {} for a VICIdial call — exactly the request this always made —
    // and { call_id } for a Stringee one, which is what routes it to the right
    // provider server-side.
    callHangup: builder.mutation({
      query: (params = {}) => ({
        url: '/hangup',
        method: 'POST',
        params: Object.keys(params).length ? params : undefined,
      }),
    }),
    // Stringee's equivalent of /status_data. Poll by call_id, or by ref_id in
    // the window before the carrier has told us the call_id.
    callStatus: builder.query({
      query: (params = {}) => ({ url: '/call_status', params }),
    }),
    // Web SDK login for the agent's own StringeeX user (browser dial mode).
    // A mutation, not a query: a token must never be served from cache.
    stringeeClientToken: builder.mutation({
      query: () => ({ url: '/stringee/client_token', method: 'GET' }),
    }),
    // The browser reporting its own call's signalingstate.
    stringeeClientEvent: builder.mutation({
      query: (body) => ({ url: '/stringee/client_event', method: 'POST', body }),
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
