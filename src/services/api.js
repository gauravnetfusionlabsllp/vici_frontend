import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithSession } from './baseQuery';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: baseQueryWithSession,
  tagTypes: [
    'Dashboard',
    'Leads',
    'DATE_FILTERED',
    'CAMPAIGN_FILTERED',
    'USERNAME_FILTERED',
    'EmailTemplates',
    'EmailAttachments',
    'CampaignLeads',
    'HotMetaLeads',
    'CustomColumns',
    'ManagerView',
    'WhatsappMessages',
  ],
  endpoints: () => ({}),
});
