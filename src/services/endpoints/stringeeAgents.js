import { dashboardApi } from '../api';

// Admin mapping between a VICIdial login and a StringeeX agent
// (backend: api/routers/stringee.py). Until an agent has a row here, dialling
// a +91 number fails with "You are not linked to a StringeeX agent yet"
// (api/routers/calling.py) — this is the screen that fixes that.
//
// Note every endpoint below returns the project's {status, data} envelope and
// baseQueryWithSession does NOT unwrap it, so each needs transformResponse.
export const {
  useGetStringeeAgentsQuery,
  useBulkLinkStringeeAgentsMutation,
  useSetStringeeAgentLinkMutation,
  useSetStringeeAgentNumberMutation,
} = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    // One request feeds the whole screen: the StringeeX roster, the VICIdial
    // roster, and the mappings that already join them.
    getStringeeAgents: builder.query({
      query: () => ({ url: '/stringee/agents' }),
      transformResponse: (res) => ({
        stringeeAgents: res?.data?.stringee_agents ?? [],
        mappings:       res?.data?.mappings ?? [],
        viciAgents:     res?.data?.vici_agents ?? [],
      }),
      providesTags: [{ type: 'StringeeAgents', id: 'LIST' }],
    }),

    // Preferred save path: the server validates the WHOLE batch before writing
    // anything, so a half-applied mapping is impossible.
    bulkLinkStringeeAgents: builder.mutation({
      query: (links) => ({
        url: '/stringee/agent-link/bulk',
        method: 'POST',
        body: { links },
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: [{ type: 'StringeeAgents', id: 'LIST' }],
    }),

    // Single-row link. Query params, not a body — the FastAPI handler declares
    // bare str args (same convention as /call and /submit_status).
    setStringeeAgentLink: builder.mutation({
      query: (params) => ({
        url: '/stringee/agent-link',
        method: 'POST',
        params,
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: [{ type: 'StringeeAgents', id: 'LIST' }],
    }),

    // Fallback PSTN number. Only used by the callout dial mode; in the default
    // browser mode the StringeeX link above is what matters.
    setStringeeAgentNumber: builder.mutation({
      query: (params) => ({
        url: '/stringee/agent-number',
        method: 'POST',
        params,
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: [{ type: 'StringeeAgents', id: 'LIST' }],
    }),
  }),
});
