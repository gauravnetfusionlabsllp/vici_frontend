import { dashboardApi } from '../api';

export const {
  useGetEmailTemplatesQuery,
  useGetEmailTemplateQuery,
  useCreateEmailTemplateMutation,
  useUpdateEmailTemplateMutation,
  useDeleteEmailTemplateMutation,
  useGetEmailAttachmentsQuery,
  useUploadEmailAttachmentMutation,
  useDeleteEmailAttachmentMutation,
} = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmailTemplates: builder.query({
      query: () => '/email/templates',
      transformResponse: (res) => res.data ?? [],
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'EmailTemplates', id })), { type: 'EmailTemplates', id: 'LIST' }]
          : [{ type: 'EmailTemplates', id: 'LIST' }],
    }),
    getEmailTemplate: builder.query({
      query: (id) => `/email/templates/${id}`,
      transformResponse: (res) => res.data ?? [],
      providesTags: (result, error, id) => [{ type: 'EmailTemplates', id }],
    }),
    createEmailTemplate: builder.mutation({
      query: (body) => ({
        url: '/email/templates',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [{ type: 'EmailTemplates', id: 'LIST' }],
    }),
    updateEmailTemplate: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/email/templates/${id}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'EmailTemplates', id },
        { type: 'EmailTemplates', id: 'LIST' },
      ],
    }),
    deleteEmailTemplate: builder.mutation({
      query: (id) => ({ url: `/email/templates/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [
        { type: 'EmailTemplates', id },
        { type: 'EmailTemplates', id: 'LIST' },
      ],
    }),
    getEmailAttachments: builder.query({
      query: () => '/email/attachments',
      transformResponse: (res) => res.data ?? [],
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'EmailAttachments', id })), { type: 'EmailAttachments', id: 'LIST' }]
          : [{ type: 'EmailAttachments', id: 'LIST' }],
    }),
    uploadEmailAttachment: builder.mutation({
      query: (formData) => ({ url: '/email/attachments', method: 'POST', body: formData }),
      invalidatesTags: [{ type: 'EmailAttachments', id: 'LIST' }],
    }),
    deleteEmailAttachment: builder.mutation({
      query: (id) => ({ url: `/email/attachments/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [
        { type: 'EmailAttachments', id },
        { type: 'EmailAttachments', id: 'LIST' },
        { type: 'EmailTemplates', id: 'LIST' },
      ],
    }),
  }),
});
