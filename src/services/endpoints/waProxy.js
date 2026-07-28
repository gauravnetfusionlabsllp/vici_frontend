// Generic open-wa proxy endpoints — drives the API Explorer.
// Backend: api/routers/wa_proxy.py  ->  ANY /wa-proxy/{path} -> open-wa /api/{path}
// The JWT Bearer token is attached automatically by baseQueryWithSession, and
// the open-wa X-Api-Key is injected server-side.
import { dashboardApi } from '../api';

export const {
  useWaProxyMutation,
  useGetWaSessionsQuery,
} = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    // Call ANY open-wa endpoint. args: { method?, path, body?, params? }
    waProxy: builder.mutation({
      query: ({ method = 'GET', path, body, params }) => {
        const clean = String(path || '').replace(/^\/+/, '');
        return {
          url: `/wa-proxy/${clean}`,
          method,
          ...(params ? { params } : {}),
          ...(body != null
            ? { headers: { 'Content-Type': 'application/json' }, body }
            : {}),
        };
      },
    }),

    // Convenience query for the session picker -> GET /wa-proxy/sessions
    getWaSessions: builder.query({
      query: () => '/wa-proxy/sessions',
      transformResponse: (res) =>
        Array.isArray(res) ? res : res?.data ?? res?.sessions ?? [],
    }),
  }),
});
