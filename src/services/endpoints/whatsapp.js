import { dashboardApi } from '../api';

// WhatsApp messages resource (GET list / POST create). The `message` field is arbitrary JSONB —
// sent and received as a plain object. See the WhatsAppThread panel for the send/render convention.
export const {
  useGetWhatsappMessagesQuery,
  useSendWhatsappMessageMutation,
  useUpdateWhatsappMessageMutation,
  useSendToWhatsappMutation,
  useMarkWhatsappSeenMutation,
  useGetUnreadInboundQuery,
  useGetConversationSessionQuery,
  useSetConversationSessionMutation,
} = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    getWhatsappMessages: builder.query({
      // Arg forms (all optional):
      //   - a phone string           → filter to that exact conversation
      //   - { clientPhone }          → same as above
      //   - { agentId }              → scope to that agent's own conversations
      //   - undefined                → the full feed (admin)
      query: (arg) => {
        const clientPhone = typeof arg === 'string' ? arg : arg?.clientPhone;
        const agentId = typeof arg === 'object' && arg ? arg.agentId : undefined;
        const params = {};
        if (clientPhone) params.client_phone = clientPhone;
        else if (agentId) params.agent_id = agentId;
        return { url: '/whatsapp/messages', params: Object.keys(params).length ? params : undefined };
      },
      // Contract returns a bare array (newest-first); stay defensive against a { data } envelope.
      transformResponse: (res) => (Array.isArray(res) ? res : res?.data ?? []),
      providesTags: (result, error, arg) => {
        const clientPhone = typeof arg === 'string' ? arg : arg?.clientPhone;
        return [
          { type: 'WhatsappMessages', id: clientPhone || 'ALL' },
          { type: 'WhatsappMessages', id: 'LIST' },
        ];
      },
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
      // Pass the whole body so callers can add media_url / media_base64 /
      // mimetype / filename for file sends (backend /send auto-routes media).
      // The reply is routed server-side to the number this conversation is
      // already on, so no `session` is needed here; the response echoes back
      // `session` / `session_phone` for stamping onto the stored row. A 409 means
      // that number is banned/logged out — refetch the conversation session and
      // let the user pick another.
      query: (body) => ({ url: '/send', method: 'POST', body }),
    }),

    // Which of OUR numbers this chat is on, whether it can still send, and the
    // connected alternatives to switch to. Separate from the fleet-wide
    // /wa/active-session: this is per customer.
    getConversationSession: builder.query({
      query: (clientPhone) => ({
        url: '/wa/conversation-session',
        params: { client_phone: clientPhone },
      }),
      providesTags: (result, error, clientPhone) => [
        { type: 'WaConversationSession', id: clientPhone || 'ALL' },
      ],
    }),

    // Move this chat to another number (session_id null/'' clears the override).
    setConversationSession: builder.mutation({
      query: ({ clientPhone, sessionId, reason }) => ({
        url: '/wa/conversation-session',
        method: 'POST',
        body: { client_phone: clientPhone, session_id: sessionId ?? null, reason },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'WaConversationSession', id: arg?.clientPhone || 'ALL' },
      ],
    }),

    // Unseen inbound replies for notifications (scoped to the agent's own
    // conversations when agentId is passed).
    getUnreadInbound: builder.query({
      query: (agentId) => ({
        url: '/whatsapp/unread-inbound',
        params: agentId ? { agent_id: agentId } : undefined,
      }),
      transformResponse: (res) => res?.data ?? [],
      providesTags: [{ type: 'WhatsappMessages', id: 'UNREAD' }],
    }),

    // Mark a phone's inbound messages as seen (clears the unread badge).
    markWhatsappSeen: builder.mutation({
      query: (clientPhone) => ({
        url: '/whatsapp/messages/seen',
        method: 'POST',
        params: { client_phone: clientPhone },
      }),
      invalidatesTags: (result, error, clientPhone) => [
        { type: 'WhatsappMessages', id: clientPhone || 'ALL' },
        { type: 'WhatsappMessages', id: 'LIST' },
        { type: 'WhatsappMessages', id: 'UNREAD' },  // refresh the notification bell
      ],
    }),
  }),
});
