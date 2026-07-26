import { dashboardApi } from '../api';

// WhatsApp messages resource (GET list / POST create). The `message` field is arbitrary JSONB —
// sent and received as a plain object. See the WhatsAppThread panel for the send/render convention.
export const {
  useGetWhatsappMessagesQuery,
  useSendWhatsappMessageMutation,
  useUpdateWhatsappMessageMutation,
  useSendToWhatsappMutation,
} = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    getWhatsappMessages: builder.query({
      // clientPhone optional: when provided, filter to that exact phone; otherwise return all.
      query: (clientPhone) => ({
        url: '/whatsapp/messages',
        params: clientPhone ? { client_phone: clientPhone } : undefined,
      }),
      // Contract returns a bare array (newest-first); stay defensive against a { data } envelope.
      transformResponse: (res) => (Array.isArray(res) ? res : res?.data ?? []),
      providesTags: (result, error, clientPhone) => [
        { type: 'WhatsappMessages', id: clientPhone || 'ALL' },
        { type: 'WhatsappMessages', id: 'LIST' },
      ],
    }),
    sendWhatsappMessage: builder.mutation({
      query: (body) => ({ url: '/whatsapp/messages', method: 'POST', body }),
      // Invalidate the specific phone thread + the unfiltered list so open views refetch.
      invalidatesTags: (result, error, body) => [
        { type: 'WhatsappMessages', id: body?.client_phone || 'ALL' },
        { type: 'WhatsappMessages', id: 'LIST' },
      ],
    }),
    // Update an existing message's `message` JSON (used by the admin to flip status → 'sent' after
    // dispatching via WhatsApp). `clientPhone` in the arg is only for cache invalidation.
    updateWhatsappMessage: builder.mutation({
      query: ({ id, message }) => ({
        url: `/whatsapp/messages/${id}`,
        method: 'PATCH',
        body: { message },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'WhatsappMessages', id: arg?.clientPhone || 'ALL' },
        { type: 'WhatsappMessages', id: 'LIST' },
      ],
    }),
    // Deliver a message to WhatsApp: POST /send { to, message } (plain-text body). Authorized
    // endpoint — goes through the shared client so it carries the Bearer token. No cache tags
    // (delivery doesn't change the messages list; the PATCH above marks the record sent).
    sendToWhatsapp: builder.mutation({
      query: ({ to, message }) => ({ url: '/send', method: 'POST', body: { to, message } }),
    }),
  }),
});
