import { createSlice } from "@reduxjs/toolkit";

export const CALL_STATE = {
  IDLE: "IDLE",
  DIALING: "DIALING",
  INCALL: "INCALL",
  ENDING: "ENDING",
  DISPO: "DISPO",
};

export const PROVIDER = {
  VICIDIAL: "vicidial",
  STRINGEE: "stringee",
};

/**
 * The one object that says WHICH dialer is carrying the current call.
 * { provider, id, refId } — id is Stringee's callId (null until its first
 * webhook event lands), refId is our own correlation id, and both are null
 * for a VICIdial call, which is addressed by agent instead.
 *
 * Dial, hangup and disposition all read this. Nothing else should branch on
 * the provider.
 */
const noCall = { provider: PROVIDER.VICIDIAL, id: null, refId: null, mode: null, fromNumber: null, toNumber: null };

const callSlice = createSlice({
  name: "call",
  initialState: {
    state: CALL_STATE.IDLE,
    showDispo: false,
    isCallbackDial : false,
    currentCall: noCall,
  },
  reducers: {
    setCallState(state, action) {
      state.state = action.payload;
    },
    /** Take the provider straight off a /call response. */
    setCurrentCallFromDial(state, action) {
      const res = action.payload || {};
      state.currentCall = {
        provider: res.provider === PROVIDER.STRINGEE ? PROVIDER.STRINGEE : PROVIDER.VICIDIAL,
        id:       res.call_id ?? null,
        refId:    res.ref_id ?? null,
        // "browser" = the dashboard itself dials (useStringeeBrowserCall).
        mode:       res.mode ?? null,
        fromNumber: res.from_number ?? null,
        toNumber:   res.dialed_phone ?? null,
      };
    },
    /** Fill in the callId once /call_status has learned it. */
    setCurrentCallId(state, action) {
      if (state.currentCall) state.currentCall.id = action.payload ?? null;
    },
    clearCurrentCall(state) {
      state.currentCall = noCall;
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
      state.currentCall = noCall;
    },
    setIsCallbackDial(state,action){
      state.isCallbackDial = action.payload
    }
  },
});

export const {
  setCallState, openDispo, closeDispo, resetCall, setIsCallbackDial,
  setCurrentCallFromDial, setCurrentCallId, clearCurrentCall,
} = callSlice.actions;

export default callSlice.reducer;

export const selectCallState = (s) => s.call.state;
export const selectShowDispo = (s) => s.call.showDispo;
export const selectIsCallbackDial = (s) => s.call.isCallbackDial;
export const selectCurrentCall = (s) => s.call.currentCall ?? noCall;
export const selectIsStringeeCall = (s) =>
  (s.call.currentCall?.provider ?? PROVIDER.VICIDIAL) === PROVIDER.STRINGEE;

/**
 * The params hangup / submit_status need for the ACTIVE provider.
 * VICIdial gets {} — byte-for-byte the call it always made.
 */
export const selectCallRouteParams = (s) => {
  const c = s.call.currentCall;
  if (c?.provider !== PROVIDER.STRINGEE) return {};
  // StringeeX/PCC callout returns no call id, so ref_id is normally all we
  // have. Either one routes the request to the Stringee path server-side;
  // {} would send it to VICIdial.
  if (c.id) return { call_id: c.id };
  if (c.refId) return { ref_id: c.refId };
  return {};
};

export const selectIsCallBusy = (s) =>
  s.call.state !== CALL_STATE.IDLE; // disable DIAL NEXT when true

