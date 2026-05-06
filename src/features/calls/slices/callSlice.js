import { createSlice } from "@reduxjs/toolkit";

export const CALL_STATE = {
  IDLE: "IDLE",
  DIALING: "DIALING",
  INCALL: "INCALL",
  ENDING: "ENDING",
  DISPO: "DISPO",
};

const callSlice = createSlice({
  name: "call",
  initialState: {
    state: CALL_STATE.IDLE,
    showDispo: false,
    isCallbackDial : false
  },
  reducers: {
    setCallState(state, action) {
      state.state = action.payload;
    },
    openDispo(state) {
      state.showDispo = true;
      state.state = CALL_STATE.DISPO;
    },
    closeDispo(state) {
      state.showDispo = false;
    //   state.state = CALL_STATE.IDLE;
    },
    resetCall(state) {
      state.state = CALL_STATE.IDLE;
      state.showDispo = false;
    },
    setIsCallbackDial(state,action){
      state.isCallbackDial = action.payload
    }
  },
});

export const { setCallState, openDispo, closeDispo, resetCall ,setIsCallbackDial} =
  callSlice.actions;

export default callSlice.reducer;

export const selectCallState = (s) => s.call.state;
export const selectShowDispo = (s) => s.call.showDispo;
export const selectIsCallbackDial = (s) => s.call.isCallbackDial;

export const selectIsCallBusy = (s) =>
  s.call.state !== CALL_STATE.IDLE; // disable DIAL NEXT when true

