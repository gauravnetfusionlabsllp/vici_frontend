import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { showSessionPopup } from '../slices/sessionSlice.js';

let isSessionExpired = false;
export const getSessionExpired = () => isSessionExpired;
export const setSessionExpired = (val) => {
  isSessionExpired = val;
};
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_BASE_URL,
  prepareHeaders: (headers) => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
  
    const accessToken = user?.access_token;
    if (accessToken) {
      headers.set("authorization", `Bearer ${accessToken}`);
    }

    return headers;
  },
});
const addParamsToUrl = (url, paramsObj) => {
  const qs = new URLSearchParams(paramsObj).toString();
  if (!qs) return url;
  return url.includes("?") ? `${url}&${qs}` : `${url}?${qs}`;
};

// ✅ Interceptor
const baseQueryWithSession = async (args, api, extraOptions) => {
  const isRefreshCall =
    typeof args === "object" && args.url === "/refresh";
  if (getSessionExpired() && !isRefreshCall) {
    return { error: { status: 401, data: "Session paused" } };
  }
  const withDate = extraOptions?.withDate === true;
    const withCampaign = extraOptions?.withCampaign === true; 
    const withUsername = extraOptions?.withUsername === true; 
  const req = typeof args === "string" ? { url: args } : { ...args };
  if (withDate) {
    // read date range from redux
    const { from, to } = api.getState().dateFilter || {}; // <-- your slice name
    // if you store as startDate/endDate, rename accordingly

    const params = {};
    if (from) params.sd = from; // "YYYY-MM-DD"
    if (to) params.ed = to;
    // attach to URL as query params
    if (Object.keys(params).length) {
      req.url = addParamsToUrl(req.url, params);
    }
  }
  if (withCampaign) { // 👈 new block
    const { campaignId } = api.getState().campaignAndUsernameFilter || {};
    if (campaignId) {
      req.url = addParamsToUrl(req.url, { campaign_id: campaignId });
    }
    
  }
  if (withUsername) { // 👈 new block
    const { username } = api.getState().campaignAndUsernameFilter || {};
    if (username) {
      req.url = addParamsToUrl(req.url, { user_id: username });
    }
  }
  const result = await baseQuery(req, api, extraOptions);

  
  if (result?.error?.status === 401) {
     setSessionExpired(true);
    api.dispatch(showSessionPopup());
  }

  return result;
};
export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: baseQueryWithSession,
  tagTypes: ['Dashboard', "Leads","DATE_FILTERED",'CAMPAIGN_FILTERED','USERNAME_FILTERED','EmailTemplates','EmailAttachments',],
  endpoints: (builder) => ({

    //   getOverview: builder.query({
    //     query: () => '/dashboard',
    //     providesTags: ['Dashboard'],
    //     pollingInterval: 60000,
    // skipPollingIfUnfocused: true,
    // keepUnusedDataFor: 60, 
    // extraOptions: {
    //   maxRetries: 3,
    // },

    //   }),
    login: builder.mutation({
      query: (body) => ({
        url: "/login",
        method: "POST",
        body,
      }),
    }),
    refresh: builder.mutation({
      query: (body) => ({
        url: "/refresh",
        method: "POST",
        body,
      }),
    }),
    getTotalDialsToday: builder.query({
      query: () => '/totaldialstoday',
      providesTags: ['Dashboard',"DATE_FILTERED",'CAMPAIGN_FILTERED','USERNAME_FILTERED'],
      keepUnusedDataFor: 60,
      extraOptions: {
        maxRetries: 3,
        withDate: true,
        withCampaign: true ,
        withUsername: true
      },

    }),

    // getAgentsOnCalls: builder.query({
    //   query: () => '/getcallswaiting',
    //   providesTags: ['Dashboard'],
    //   pollingInterval: 60000,

    //   transformResponse: (res) => res.data,
    // }),

    // getAgentPerformance: builder.query({
    //   query: () => '/getagnetstimeoncall',
    //   providesTags: ['Dashboard'],
    //   pollingInterval: 60000,
    //   transformResponse: (res) =>
    //     res.data.map((a) => ({
    //       station: a.STATION,
    //       agent: a.USER,
    //       status: a.STATUS,
    //       callsHandled: a.CALLS,
    //       campaign: a.CAMPAIGN,
    //       talkTime: a.TALK_TIME_HH_MM_SS,
    //     })),
    // }),

    getCallStatus: builder.query({
      query: () => '/getcallbystatus',
      providesTags: ['Dashboard',"DATE_FILTERED",'CAMPAIGN_FILTERED','USERNAME_FILTERED'],
      extraOptions: {
        maxRetries: 3,
        withDate: true,
        withCampaign: true , 
        withUsername: true

      },
    }),

    getAllData: builder.query({
      query: () => '/get_all_data',
      providesTags: ['Dashboard'],
    }),

    getAgentsProductivity: builder.query({
      query: () => '/agentsproductivity',
      providesTags: ['Dashboard',"DATE_FILTERED",'CAMPAIGN_FILTERED'],
      extraOptions: {
        maxRetries: 3,
        withDate: true,
         withCampaign: true
      },
    }),

    getCampaignPerformance: builder.query({
      query: () => '/campaignperformance',
      providesTags: ['Dashboard',"DATE_FILTERED",'USERNAME_FILTERED'],
      extraOptions: {
        maxRetries: 3,
        withDate: true,
        withUsername: true
      },
    }),
    getDialerPerformance: builder.query({
      query: () => '/dialerperformance',
      providesTags: ['Dashboard', 'DATE_FILTERED', 'CAMPAIGN_FILTERED','USERNAME_FILTERED'],
      extraOptions: {
        maxRetries: 3,
        withDate: true,
        withCampaign: true,
        withUsername: true
      },
    }),
    getHourlyPerformance: builder.query({
      query: () => '/hourlyperformance',
      providesTags: ['Dashboard'],
    }),
    getGraphData: builder.query({
      query: () => '/graphdata',
      providesTags: ['Dashboard'],
    }),
    getCompliancereview: builder.query({
      query: () => '/compliancereview',
      providesTags: ['Dashboard'],
    }),
    getLeadfunnel: builder.query({
      query: () => "/leadfunnel",
      providesTags: ['Dashboard',"DATE_FILTERED",'CAMPAIGN_FILTERED','USERNAME_FILTERED'],
      extraOptions: {
        maxRetries: 3,
        withDate: true,
        withCampaign: true,
        withUsername: true
      },
      
    }),
    uploadExcelLeads: builder.mutation({
      query: (formData) => ({
        url: "/upload_excel_leads",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Leads"],
    }),

    getLeads: builder.query({
      query: (params = {}) => ({
        url: "/leads",
        params: Object.keys(params).length ? params : undefined,
      }),
      providesTags: ["Leads"],
    }),
    dialNext: builder.mutation({
      query: (params={}) => ({
        url: "/call",
        method: "POST",
        // body: body ?? {}, 
        // params: { phone },
        params: Object.keys(params).length ? params : undefined,
      }),
    }),
    callHangup: builder.mutation({
      query: () => ({
        url: "/hangup",
        method: "POST",

      }),
    }),
    getLogData: builder.query({
      query: (user) => ({
        url: "/logdata",
        method: "POST",
        params: { user },
      }),
    }),

    submitStatus: builder.mutation({
      query: (params = {}) => ({
        url: "/submit_status",
        method: "POST",
        params: Object.keys(params).length ? params : undefined,
      }),
    }),
    getAgentWiseLead: builder.query({
      query: (params={}) => ({
        url: "/clients_for_agent",
        method: "POST",
        params: Object.keys(params).length ? params : undefined,
      }),
      providesTags: ["Leads"],
    }),
    ping: builder.query({
      query: () => "/ping",
    }),
    userTimeline: builder.query({
      query: () => "/usertimeline",
    }),
    getCampaigns: builder.query({
  query: (username) => ({
    url: "/campaigns",
    params: username ? { username } : {},
  }),
}),
    deleteLead: builder.mutation({
      // adjust this URL to match your backend
      // option A: delete by lead_id
      query: (phones ) => ({
        url: "/delete_lead",
        method: "POST",
        body: { phone_number: phones }
      }),
      invalidatesTags: ["Leads"],
    }),
    statusData: builder.query({
      query: () => "/status_data",
    }),
    sendMessage: builder.mutation({
      query: (phone ) => ({
        url: "/send-sms",
        method: "POST",
        body: { phone_number: phone }
      }),
      invalidatesTags: ["Leads"],
    }),
    getMetaLeadStats: builder.query({
  query: () => "/metalead-stats",
  providesTags: ['Dashboard', 'DATE_FILTERED'],
  keepUnusedDataFor: 60,
  extraOptions: {
    maxRetries: 3,
    withDate: true,
  },
    }),
    
    /** GET /email/templates — list all templates + their attachments */
    getEmailTemplates: builder.query({
      query: () => "/email/templates",
      transformResponse: (res) => res.data ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'EmailTemplates', id })),
              { type: 'EmailTemplates', id: 'LIST' },
            ]
          : [{ type: 'EmailTemplates', id: 'LIST' }],
    }),
 
    /** GET /email/templates/{id} — get one template */
    getEmailTemplate: builder.query({
      query: (id) => `/email/templates/${id}`,
      transformResponse: (res) => res.data ?? [],
      providesTags: (result, error, id) => [{ type: 'EmailTemplates', id }],
    }),
 
    /** POST /email/templates — create template, optionally link attachment IDs */
    createEmailTemplate: builder.mutation({
      query: (body) => ({
        url: "/email/templates",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      }),
      invalidatesTags: [{ type: 'EmailTemplates', id: 'LIST' }],
    }),
 
    /** PUT /email/templates/{id} — update template / swap attachments */
    updateEmailTemplate: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/email/templates/${id}`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'EmailTemplates', id },
        { type: 'EmailTemplates', id: 'LIST' },
      ],
    }),
 
    /** DELETE /email/templates/{id} — delete template */
    deleteEmailTemplate: builder.mutation({
      query: (id) => ({
        url: `/email/templates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'EmailTemplates', id },
        { type: 'EmailTemplates', id: 'LIST' },
      ],
    }),
 
    // ─────────────────────────────────────────────
    // EMAIL ATTACHMENTS  (Admin-only)
    // ─────────────────────────────────────────────
 
    /** GET /email/attachments — list all uploaded files */
    getEmailAttachments: builder.query({
      query: () => "/email/attachments",
      transformResponse: (res) => res.data ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'EmailAttachments', id })),
              { type: 'EmailAttachments', id: 'LIST' },
            ]
          : [{ type: 'EmailAttachments', id: 'LIST' }],
    }),
 
    /** POST /email/attachments — upload file (multipart) */
    uploadEmailAttachment: builder.mutation({
      query: (formData) => ({
        url: "/email/attachments",
        method: "POST",
        body: formData,
        // Do NOT set Content-Type — browser sets it with boundary for multipart
      }),
      invalidatesTags: [{ type: 'EmailAttachments', id: 'LIST' }],
    }),
 
    /** DELETE /email/attachments/{id} — delete file from disk + DB */
    deleteEmailAttachment: builder.mutation({
      query: (id) => ({
        url: `/email/attachments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'EmailAttachments', id },
        { type: 'EmailAttachments', id: 'LIST' },
        // Templates may reference this attachment, so refresh them too
        { type: 'EmailTemplates', id: 'LIST' },
      ],
    }),
  
  }),
});

export const {
  // useGetOverviewQuery,
  // useGetAgentsOnCallsQuery,
  // useGetAgentPerformanceQuery,
  useLoginMutation,
  useRefreshMutation,
  useGetCallStatusQuery,
  useGetAllDataQuery,
  useGetTotalDialsTodayQuery,
  useGetAgentsProductivityQuery,
  useGetCampaignPerformanceQuery,
  useGetDialerPerformanceQuery,
  useGetHourlyPerformanceQuery,
  useGetGraphDataQuery,
  useGetCompliancereviewQuery,
  useGetLeadfunnelQuery,
  useUploadExcelLeadsMutation,
  useGetLeadsQuery,
  useDialNextMutation,
  useCallHangupMutation,
  useGetLogDataQuery,
  useSubmitStatusMutation,
  useGetAgentWiseLeadQuery,
  usePingQuery,
  useUserTimelineQuery,
  useGetCampaignsQuery,
  useDeleteLeadMutation,
  useStatusDataQuery,
  useSendMessageMutation,
  useGetMetaLeadStatsQuery,
  useGetEmailTemplatesQuery,
  useGetEmailTemplateQuery,
  useCreateEmailTemplateMutation,
  useUpdateEmailTemplateMutation,
  useDeleteEmailTemplateMutation,
  // Email Attachments
  useGetEmailAttachmentsQuery,
  useUploadEmailAttachmentMutation,
  useDeleteEmailAttachmentMutation,
} = dashboardApi;
