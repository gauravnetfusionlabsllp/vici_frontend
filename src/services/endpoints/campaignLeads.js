import { dashboardApi } from '../api';

export const {
  useGetCampaignLeadsQuery,
  useCreateCampaignLeadMutation,
  useToggleCampaignLeadActiveMutation,
  useDeleteCampaignLeadMutation,
  useSyncCampaignLeadRuleMutation,
  useLeadFiltersQuery,
} = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    getCampaignLeads: builder.query({
      query: () => '/campaign-leads',
      transformResponse: (res) => res.data ?? [],
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'CampaignLeads', id })), { type: 'CampaignLeads', id: 'LIST' }]
          : [{ type: 'CampaignLeads', id: 'LIST' }],
    }),
    createCampaignLead: builder.mutation({
      query: (body) => ({
        url: '/campaign-leads',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [{ type: 'CampaignLeads', id: 'LIST' }],
    }),
    toggleCampaignLeadActive: builder.mutation({
      query: (id) => ({ url: `/campaign-leads/${id}/toggle-active`, method: 'PATCH' }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          dashboardApi.util.updateQueryData('getCampaignLeads', undefined, (draft) => {
            const item = draft.find((l) => l.id === id);
            if (item) item.isactive = !item.isactive;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (result, error, id) => [{ type: 'CampaignLeads', id }],
    }),
    deleteCampaignLead: builder.mutation({
      query: (id) => ({ url: `/campaign-leads/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [
        { type: 'CampaignLeads', id },
        { type: 'CampaignLeads', id: 'LIST' },
      ],
    }),
    syncCampaignLeadRule: builder.mutation({
      query: (params) => ({ url: '/campaign-leads/sync', method: 'POST', params }),
    }),
    leadFilters: builder.query({
      query: (params = {}) => ({
        url: '/meta/lead-filters',
        params,
      }),
    }),
  }),
});
