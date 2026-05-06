import { configureStore } from '@reduxjs/toolkit';
import { dashboardApi } from '@/services';
import sessionReducer from '@/features/auth/slices/sessionSlice';
import authReducer from '@/features/auth/slices/authSlice';
import dialReducer from '@/features/calls/slices/dialSlice';
import callReducer from '@/features/calls/slices/callSlice';
import dateFilterReducer from '@/features/dashboard/slices/dateFilterSlice';
import campaignAndUsernameFilterReducer from '@/features/dashboard/slices/campaignAndUsernameFilterSlice';

export const store = configureStore({
  reducer: {
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    session: sessionReducer,
    auth: authReducer,
    dial: dialReducer,
    call: callReducer,
    dateFilter: dateFilterReducer,
    campaignAndUsernameFilter: campaignAndUsernameFilterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(dashboardApi.middleware),
});
