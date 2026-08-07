import { dashboardApi } from '../api';

export const {
  useGetWaTemplatesQuery,
  useCreateWaTemplateMutation,
  useUpdateWaTemplateMutation,
  useDeleteWaTemplateMutation,
  useTestWaTemplateMutation,
  useGetWaHolidaysQuery,
  useCreateWaHolidayMutation,
  useDeleteWaHolidayMutation,
  useGetWaAutomationSettingsQuery,
  useUpdateWaAutomationSettingsMutation,
  useGetWaMetaOptionsQuery,
  useGetWaAutoLogQuery,
} = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Templates ────────────────────────────────────────────────────
    getWaTemplates: builder.query({
      query: () => '/whatsapp-automation/templates',
      // Keep `placeholders` alongside the rows so the form can list the
      // available {{tokens}} without a second request.
      transformResponse: (res) => ({
        templates: res?.data ?? [],
        placeholders: res?.placeholders ?? [],
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.templates.map(({ id }) => ({ type: 'WaTemplates', id })),
              { type: 'WaTemplates', id: 'LIST' },
            ]
          : [{ type: 'WaTemplates', id: 'LIST' }],
    }),
    createWaTemplate: builder.mutation({
      query: (body) => ({
        url: '/whatsapp-automation/templates',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [{ type: 'WaTemplates', id: 'LIST' }],
    }),
    updateWaTemplate: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/whatsapp-automation/templates/${id}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: (r, e, { id }) => [
        { type: 'WaTemplates', id },
        { type: 'WaTemplates', id: 'LIST' },
      ],
    }),
    deleteWaTemplate: builder.mutation({
      query: (id) => ({ url: `/whatsapp-automation/templates/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'WaTemplates', id: 'LIST' }],
    }),
    testWaTemplate: builder.mutation({
      query: ({ id, to }) => ({
        url: `/whatsapp-automation/templates/${id}/test`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { to },
      }),
      invalidatesTags: [{ type: 'WhatsappMessages', id: 'LIST' }],
    }),

    // ── Holidays ─────────────────────────────────────────────────────
    getWaHolidays: builder.query({
      query: () => '/whatsapp-automation/holidays',
      transformResponse: (res) => res?.data ?? [],
      providesTags: [{ type: 'WaHolidays', id: 'LIST' }],
    }),
    createWaHoliday: builder.mutation({
      query: (body) => ({
        url: '/whatsapp-automation/holidays',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [{ type: 'WaHolidays', id: 'LIST' }],
    }),
    deleteWaHoliday: builder.mutation({
      query: (id) => ({ url: `/whatsapp-automation/holidays/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'WaHolidays', id: 'LIST' }],
    }),

    // ── Settings / options / activity ────────────────────────────────
    getWaAutomationSettings: builder.query({
      query: () => '/whatsapp-automation/settings',
      providesTags: [{ type: 'WaAutomation', id: 'SETTINGS' }],
    }),
    updateWaAutomationSettings: builder.mutation({
      query: (body) => ({
        url: '/whatsapp-automation/settings',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [{ type: 'WaAutomation', id: 'SETTINGS' }],
    }),
    getWaMetaOptions: builder.query({
      query: () => '/whatsapp-automation/meta-options',
      transformResponse: (res) => ({
        sources: res?.sources ?? [],
        campaigns: res?.campaigns ?? [],
      }),
    }),
    getWaAutoLog: builder.query({
      query: ({ limit = 100, status } = {}) => {
        const params = new URLSearchParams({ limit: String(limit) });
        if (status) params.set('status', status);
        return `/whatsapp-automation/logs?${params.toString()}`;
      },
      transformResponse: (res) => ({ rows: res?.data ?? [], stats: res?.stats_7d ?? {} }),
      providesTags: [{ type: 'WaAutomation', id: 'LOG' }],
    }),
  }),
});
