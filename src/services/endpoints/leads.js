import { dashboardApi } from '../api';

export const {
  useUploadExcelLeadsMutation,
  useGetLeadsQuery,
  useGetAgentWiseLeadQuery,
  useDeleteLeadMutation,
} = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadExcelLeads: builder.mutation({
      query: (formData) => ({
        url: '/upload_excel_leads',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Leads'],
    }),
    getLeads: builder.query({
      query: (params = {}) => ({
        url: '/leads',
        params: Object.keys(params).length ? params : undefined,
      }),
      providesTags: ['Leads'],
    }),
    getAgentWiseLead: builder.query({
      query: (params = {}) => ({
        url: '/clients_for_agent',
        method: 'POST',
        params: Object.keys(params).length ? params : undefined,
      }),
      providesTags: ['Leads'],
    }),
    deleteLead: builder.mutation({
      query: (phones) => ({
        url: '/delete_lead',
        method: 'POST',
        body: { phone_number: phones },
      }),
      invalidatesTags: ['Leads'],
    }),
  }),
});
