// import { configureStore } from '@reduxjs/toolkit';
// import dashboardReducer from './slices/dashboardSlice';

// export const store = configureStore({
//   reducer: {
//     dashboard: dashboardReducer,
//   },
// });


import { configureStore } from '@reduxjs/toolkit';
import { dashboardApi } from './services/dashboardApi';
import sessionReducer from "./slices/sessionSlice";
import authReducer from "./slices/authSlice";
import dialReducer from "./slices/dialSlice";
import callReducer from "./slices/callSlice";
import dateFilterReducer from "./slices/dateFilterSlice";
import campaignFilterReducer from "./slices/campaignFilterSlice";

export const store = configureStore({
  reducer: {
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    session: sessionReducer,
    auth:authReducer,
    dial: dialReducer,
    call: callReducer,
    dateFilter: dateFilterReducer,
    campaignFilter: campaignFilterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(dashboardApi.middleware),
});
