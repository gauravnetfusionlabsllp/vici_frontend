import { dashboardApi } from '../api';

// Builds the query-string params object for a manager-view request:
//  - drops null / undefined / '' values so we never send empty filters
//  - joins array values into a comma-separated string (the SET filters accept
//    a single value OR a CSV list, e.g. campaign_name=A,B). RTK Query's default
//    serializer would otherwise emit repeated keys (campaign_name=A&campaign_name=B).
function buildParams(params = {}) {
  const out = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      const csv = value.filter((v) => v !== null && v !== undefined && v !== '').join(',');
      if (csv) out[key] = csv;
    } else if (String(value).trim() !== '') {
      out[key] = value;
    }
  });
  return out;
}

// Standalone endpoints (call-analysis / meta-leads / hot-meta-lead-notes) may return either a
// bare array of rows or a wrapped { data: [...] } envelope — unwrap defensively.
const unwrapRows = (res) => (Array.isArray(res) ? res : res?.data ?? []);

export const {
  useGetManagerViewCombinedQuery,
  useGetManagerViewFilterSetsQuery,
  useGetManagerViewCallAnalysisQuery,
  useGetManagerViewMetaLeadsQuery,
  useGetManagerViewHotNotesQuery,
} = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    // PRIMARY — drives the Overview tab (KPIs, summary sections, charts, combined grid).
    // Returns the full envelope { sd, ed, count, data } so the page can show count / range.
    getManagerViewCombined: builder.query({
      query: (params = {}) => ({
        url: '/manager-view/combined',
        params: buildParams(params),
      }),
      transformResponse: (res) => ({
        sd: res?.sd ?? null,
        ed: res?.ed ?? null,
        count: res?.count ?? (Array.isArray(res?.data) ? res.data.length : 0),
        data: res?.data ?? [],
      }),
      providesTags: ['ManagerView'],
      extraOptions: { maxRetries: 2 },
    }),

    // Dropdown options for the filter bar. Optional sd/ed scope the options to a range.
    getManagerViewFilterSets: builder.query({
      query: (params = {}) => ({
        url: '/manager-view/filter-sets',
        params: buildParams(params),
      }),
      transformResponse: (res) => ({
        form_name: res?.form_name ?? [],
        campaign_name: res?.campaign_name ?? [],
        ad_name: res?.ad_name ?? [],
        adset_name: res?.adset_name ?? [],
        source: res?.source ?? [],
        agent_user: res?.agent_user ?? [],
        call_outcome: res?.call_outcome ?? [],
      }),
      providesTags: ['ManagerView'],
    }),

    // Standalone tab — AI call analysis rows.
    getManagerViewCallAnalysis: builder.query({
      query: (params = {}) => ({
        url: '/manager-view/call-analysis',
        params: buildParams(params),
      }),
      transformResponse: unwrapRows,
      providesTags: ['ManagerView'],
    }),

    // Standalone tab — Meta (Facebook) leads.
    getManagerViewMetaLeads: builder.query({
      query: (params = {}) => ({
        url: '/manager-view/meta-leads',
        params: buildParams(params),
      }),
      transformResponse: unwrapRows,
      providesTags: ['ManagerView'],
    }),

    // Standalone tab — agent follow-up notes.
    getManagerViewHotNotes: builder.query({
      query: (params = {}) => ({
        url: '/manager-view/hot-meta-lead-notes',
        params: buildParams(params),
      }),
      transformResponse: unwrapRows,
      providesTags: ['ManagerView'],
    }),
  }),
});
