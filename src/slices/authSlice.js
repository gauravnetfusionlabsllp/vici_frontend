import { createSlice } from "@reduxjs/toolkit";

const safeParse = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialState = {
  user: safeParse("user"), // persists refresh
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    clearUser(state) {
      state.user = null;
      localStorage.removeItem("user");
      // sessionStorage.clear();
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;

// optional selectors (recommended)
export const selectUser = (state) => state.auth.user;
export const selectIsAdmin = (state) => !!state.auth.user?.isAdmin;
export const selectRoleLabel = (state) =>
    state.auth.user?.isAdmin ? "Admin" : "Agent";
  export const selectUserName = (state) =>
    state.auth.user?.user || state.auth.user?.full_name || "User";