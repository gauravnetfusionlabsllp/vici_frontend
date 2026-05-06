import { createSlice } from "@reduxjs/toolkit";

const sessionSlice = createSlice({
  name: "session",
  initialState: {
    expired: false,
    loading: false,
  },
  reducers: {
    showSessionPopup: (state) => {
      state.expired = true;
    },
    hideSessionPopup: (state) => {
      state.expired = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const {
  showSessionPopup,
  hideSessionPopup,
  setLoading,
} = sessionSlice.actions;

export default sessionSlice.reducer;
