import { dashboardApi } from '../api';

// Reporting -> Manual Analysis (api/routers/manual_analysis.py). Admin only.
export const {
  useGetManualAnalysesQuery,
  useGetManualAnalysisQuery,
  useUploadManualRecordingsMutation,
  useAnalyzeManualRecordingsMutation,
  useDeleteManualRecordingMutation,
  useGetManualRecordingAudioMutation,
} = dashboardApi.injectEndpoints({
  endpoints: (builder) => ({
    getManualAnalyses: builder.query({
      query: () => '/reporting/manual-analysis',
      providesTags: ['ManualAnalysis'],
    }),

    getManualAnalysis: builder.query({
      query: (id) => `/reporting/manual-analysis/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'ManualAnalysis', id }],
    }),

    // body: FormData with files[] + optional agent_name / client_name / notes
    uploadManualRecordings: builder.mutation({
      query: (formData) => ({ url: '/reporting/manual-analysis', method: 'POST', body: formData }),
      invalidatesTags: ['ManualAnalysis'],
    }),

    analyzeManualRecordings: builder.mutation({
      query: (ids) => ({ url: '/reporting/manual-analysis/analyze', method: 'POST', body: { ids } }),
      invalidatesTags: ['ManualAnalysis'],
    }),

    deleteManualRecording: builder.mutation({
      query: (id) => ({ url: `/reporting/manual-analysis/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ManualAnalysis'],
    }),

    // The audio needs the Bearer token, which an <audio src> can't send - so it is
    // fetched as a blob and handed back as an object URL (caller revokes it). Same
    // reason and pattern as downloadRecording in ./reporting.js.
    getManualRecordingAudio: builder.mutation({
      query: (id) => ({
        url: `/reporting/manual-analysis/${id}/audio`,
        responseHandler: (response) => response.blob(),
      }),
      transformResponse: (blob) => URL.createObjectURL(blob),
    }),
  }),
});
