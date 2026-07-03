import { dashboardApi } from '../api';

export const {
  useGetHotMetaLeadsQuery,
  useUpdateHotMetaLeadMutation,
  useGetMetaLeadByPhoneQuery,
  useDownloadRecordingMutation,
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
    // Proxies a (cross-origin) call recording through our API so it can be fetched as a blob and
    // saved client-side as <agent>_<phone>.mp3. Going through baseQuery means the Bearer token is
    // sent and there's no CORS issue (same host as every other endpoint). It's a mutation, not a
    // query, so the result is never cached. transformResponse turns the Blob into an object-URL
    // *string* — a Blob in the store would trip Redux's serializability check on every action; the
    // caller revokes the URL after saving.
    downloadRecording: builder.mutation({
      query: ({ recordingLink, agentName, phone }) => ({
        url: '/reporting/download-recording',
        params: { url: recordingLink, agent_name: agentName, phone },
        responseHandler: (response) => response.blob(),
      }),
      transformResponse: (blob) => URL.createObjectURL(blob),
    }),
  }),
});
