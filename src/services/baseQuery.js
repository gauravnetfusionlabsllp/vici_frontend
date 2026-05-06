import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { showSessionPopup } from '@/features/auth/slices/sessionSlice';

let isSessionExpired = false;
export const getSessionExpired = () => isSessionExpired;
export const setSessionExpired = (val) => { isSessionExpired = val; };

const addParamsToUrl = (url, paramsObj) => {
  const qs = new URLSearchParams(paramsObj).toString();
  if (!qs) return url;
  return url.includes('?') ? `${url}&${qs}` : `${url}?${qs}`;
};

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_BASE_URL,
  prepareHeaders: (headers) => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const accessToken = user?.access_token;
    if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
    return headers;
  },
});

export const baseQueryWithSession = async (args, api, extraOptions) => {
  const isRefreshCall = typeof args === 'object' && args.url === '/refresh';
  if (getSessionExpired() && !isRefreshCall) {
    return { error: { status: 401, data: 'Session paused' } };
  }

  const req = typeof args === 'string' ? { url: args } : { ...args };

  if (extraOptions?.withDate) {
    const { from, to } = api.getState().dateFilter || {};
    const params = {};
    if (from) params.sd = from;
    if (to) params.ed = to;
    if (Object.keys(params).length) req.url = addParamsToUrl(req.url, params);
  }

  if (extraOptions?.withCampaign) {
    const { campaignId } = api.getState().campaignAndUsernameFilter || {};
    if (campaignId) req.url = addParamsToUrl(req.url, { campaign_id: campaignId });
  }

  if (extraOptions?.withUsername) {
    const { username } = api.getState().campaignAndUsernameFilter || {};
    if (username) req.url = addParamsToUrl(req.url, { user_id: username });
  }

  const result = await baseQuery(req, api, extraOptions);

  if (result?.error?.status === 401) {
    setSessionExpired(true);
    api.dispatch(showSessionPopup());
  }

  return result;
};
