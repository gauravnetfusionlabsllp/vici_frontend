// store/campaignAndUsernameFilter.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  campaignId: null,
  username:null
};

const campaignAndUsernameFilterSlice = createSlice({
  name: "campaignAndUsernameFilter",
  initialState,
  reducers: {
    setCampaignId(state, action) {
      state.campaignId = action.payload ?? null;
    },
    setUsername(state, action) {
      state.username = action.payload ?? null;
    },
    resetCampaignId(state) {
      state.campaignId = null;
    },
    resetUsername(state) {
      state.username = null;
    },
  },
});

export const { setCampaignId, resetCampaignId, setUsername, resetUsername } = campaignAndUsernameFilterSlice.actions;
export const selectCampaignId = (s) => s.campaignAndUsernameFilter.campaignId;
export const selectUsername = (s) => s.campaignAndUsernameFilter.username; 
export default campaignAndUsernameFilterSlice.reducer;