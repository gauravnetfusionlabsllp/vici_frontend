import { createSlice } from "@reduxjs/toolkit";

function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
const initialState = {
  from: todayYMD(), // "2026-02-01"
  to: todayYMD(),  // "2026-02-04"
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // optional
};

const dateFilterSlice = createSlice({
  name: "dateFilter",
  initialState,
  reducers: {
    setDateRange(state, action) {
      const { from, to } = action.payload || {};
      state.from = from ?? null;
      state.to = to ?? null;
    },
    resetDateRange(state) {
      state.from = null;
      state.to = null;
    },
    setTimezone(state, action) {
      state.timezone = action.payload;
    },
  },
});

export const { setDateRange, resetDateRange, setTimezone } = dateFilterSlice.actions;

export const selectDateRange = (s) => s.dateFilter;

export default dateFilterSlice.reducer;
