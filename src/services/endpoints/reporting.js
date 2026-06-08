import { dashboardApi } from '../api';

export const {
  useGetHotMetaLeadsQuery,
  useUpdateHotMetaLeadMutation,
  useGetMetaLeadByPhoneQuery,
} = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    getMetaLeadByPhone: builder.query({
      query: (phone) => `/reporting/meta-leads?phone=${encodeURIComponent(phone)}`,
      transformResponse: (res) => res?.data?.[0] ?? null,
    }),
    getHotMetaLeads: builder.query({
      query: () => '/reporting/hot-meta-leads-direct',
      transformResponse: (res) => res?.data ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((r) => ({ type: 'HotMetaLeads', id: r.lead_id })),
              { type: 'HotMetaLeads', id: 'LIST' },
              'DATE_FILTERED',
            ]
          : [{ type: 'HotMetaLeads', id: 'LIST' }, 'DATE_FILTERED'],
      extraOptions: { maxRetries: 3, withDate: true },
    }),
    updateHotMetaLead: builder.mutation({
      query: ({ leadId, body }) => ({
        url: `/reporting/hot-meta-leads/${leadId}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      async onQueryStarted({ leadId, body, currentUser }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          dashboardApi.util.updateQueryData('getHotMetaLeads', undefined, (draft) => {
            const row = draft.find((r) => r.lead_id === leadId);
            if (!row) return;
            const now = new Date().toISOString();
            Object.assign(row, body);
            row.agent_user = row.agent_user || currentUser?.user;
            row.agent_name = row.agent_name || currentUser?.full_name || currentUser?.user;
            row.first_status_change = row.first_status_change || now;
            row.last_status_change = now;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (result, error, { leadId }) => [{ type: 'HotMetaLeads', id: leadId }],
    }),
  }),
});
