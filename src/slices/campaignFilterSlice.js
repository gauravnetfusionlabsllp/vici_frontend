// store/campaignFilterSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  campaignId: null,
};

const campaignFilterSlice = createSlice({
  name: "campaignFilter",
  initialState,
  reducers: {
    setCampaignId(state, action) {
      state.campaignId = action.payload ?? null;
    },
    resetCampaignId(state) {
      state.campaignId = null;
    },
  },
});

export const { setCampaignId, resetCampaignId } = campaignFilterSlice.actions;
export const selectCampaignId = (s) => s.campaignFilter.campaignId;
export default campaignFilterSlice.reducer;