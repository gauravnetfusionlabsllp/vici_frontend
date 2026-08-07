import { dashboardApi } from '../api';

export const {
  useGetDoubleTickOverviewQuery,
  useGetDoubleTickConversationsQuery,
  useGetDoubleTickConversationQuery,
  useGetDoubleTickTableQuery,
  useSyncDoubleTickMutation,
} = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    // Searchable index of every conversation.
    getDoubleTickConversations: builder.query({
      query: ({ sd, ed, search, agent, tag, unread_only, limit = 50, offset = 0 } = {}) => ({
        url: '/double-tick/conversations',
        params: {
          ...(sd ? { sd } : {}),
          ...(ed ? { ed } : {}),
          ...(search ? { search } : {}),
          ...(agent ? { agent } : {}),
          ...(tag ? { tag } : {}),
          ...(unread_only ? { unread_only } : {}),
          limit,
          offset,
        },
      }),
      providesTags: [{ type: 'DoubleTick', id: 'CONVERSATIONS' }],
    }),

    // Full message thread for one contact, both sides.
    getDoubleTickConversation: builder.query({
      query: ({ phone, waba }) => ({
        url: '/double-tick/conversation',
        params: { phone, ...(waba ? { waba } : {}) },
      }),
      providesTags: (r, e, { phone }) => [{ type: 'DoubleTick', id: `THREAD-${phone}` }],
    }),

    // Pre-aggregated dashboard payload (KPIs + every chart series + tables),
    // scoped to the page's selected date range.
    getDoubleTickOverview: builder.query({
      query: ({ sd, ed } = {}) => ({
        url: '/double-tick/overview',
        params: { ...(sd ? { sd } : {}), ...(ed ? { ed } : {}) },
      }),
      providesTags: [{ type: 'DoubleTick', id: 'OVERVIEW' }],
    }),

    // Raw table browser — any double_tick_* table, paged.
    getDoubleTickTable: builder.query({
      query: ({ table, limit = 100, offset = 0 }) => ({
        url: `/double-tick/${table}`,
        params: { limit, offset },
      }),
      providesTags: (r, e, { table }) => [{ type: 'DoubleTick', id: table }],
    }),

    // Pull fresh data from the DoubleTick API into Postgres.
    syncDoubleTick: builder.mutation({
      query: (params = {}) => ({
        url: '/double-tick/sync',
        method: 'POST',
        params: { include_messages: true, only_new: true, wait: true, ...params },
      }),
      invalidatesTags: [{ type: 'DoubleTick', id: 'OVERVIEW' }],
    }),
  }),
});
