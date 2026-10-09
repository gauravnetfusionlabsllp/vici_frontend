import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  CALL_STATE, PROVIDER, selectCallState, selectCurrentCall, setCurrentCallId, setStringeeWaiting,
} from "@/features/calls/slices/callSlice";
import { useStringeeClientEventMutation, useStringeeClientTokenMutation } from "@/services";
import { useToast } from "@/shared/hooks/useToast";
import * as stringeePhone from "@/features/calls/lib/stringeePhone";

// How often a call parked on a Stringee outage tries again.
const RETRY_MS = 10000;

/**
 * Places the call in this tab whenever /call hands back a browser dial plan
 * ({ provider: "stringee", mode: "browser" }). Every dial path - manual,
 * DIAL NEXT, callbacks, auto-dial - goes through currentCall, so watching it
 * here covers them all without touching each caller.
 *
 * Progress goes to POST /stringee/client_event; CallPage's /call_status poll
 * then sees it like any other Stringee call, which is what opens the
 * disposition popup when the call ends.
 *
 * Stringee down (SDK, login or connection - see StringeeDownError): the call
 * is NOT failed. It stays parked - row 'initiated', lead locked, no dispo -
 * and is retried every RETRY_MS until Stringee answers, then placed as
 * normal. Auto-dial waits with it, since the agent is still "in a call".
 * Pressing END while parked stops the retries.
 *
 * Must be mounted EXACTLY ONCE (TopBar, next to useAutoDial).
 */
export function useStringeeBrowserCall() {
  const dispatch = useDispatch();
  const call = useSelector(selectCurrentCall);
  const callState = useSelector(selectCallState);
  const [getToken] = useStringeeClientTokenMutation();
  const [sendEvent] = useStringeeClientEventMutation();
  const { error: toastError, info: toastInfo, success: toastSuccess } = useToast();
  const startedRef = useRef(null);

  // What the retry loop checks before every attempt: is this still the call on
  // screen, and is the agent still waiting on it (not ENDING / DISPO / IDLE)?
  const liveRef = useRef({ refId: null, callState });
  useEffect(() => {
    liveRef.current = { refId: call.refId, callState };
  }, [call.refId, callState]);

  // END while parked: drop the "waiting" banner now rather than at the next
  // retry tick, which then sees the call is no longer parked and stops.
  useEffect(() => {
    if (callState !== CALL_STATE.INCALL) dispatch(setStringeeWaiting(false));
  }, [callState, dispatch]);

  const { provider, mode, refId, fromNumber, toNumber } = call;

  useEffect(() => {
    if (provider !== PROVIDER.STRINGEE || mode !== "browser" || !refId) return;
    if (startedRef.current === refId) return;
    startedRef.current = refId;

    let answeredAt = null;
    // Once the customer's phone rang, the customer is involved: any failure
    // after that is a real outcome for the dispo, never a retry.
    let reachedCustomer = false;
    let waiting = false;

    const report = (code, reason, callId, extra = {}) =>
      sendEvent({ ref_id: refId, call_id: callId || null, code, reason, ...extra })
        .unwrap()
        .catch(() => {});

    const stillParked = () =>
      liveRef.current.refId === refId && liveRef.current.callState === CALL_STATE.INCALL;

    const stopWaiting = () => {
      if (!waiting) return;
      waiting = false;
      dispatch(setStringeeWaiting(false));
    };

    const attempt = async () => {
      try {
        await stringeePhone.connect(() => getToken().unwrap());

        if (waiting) {
          stopWaiting();
          toastSuccess("Stringee is back - connecting your call.");
        }

        const callId = await stringeePhone.dial({
          from: fromNumber,
          to: toNumber,
          custom: JSON.stringify({ ref: refId }),
          onState: (state, c) => {
            if (state.code === stringeePhone.SDK_STATE.RINGING) reachedCustomer = true;
            if (state.code === stringeePhone.SDK_STATE.ANSWERED) {
              reachedCustomer = true;
              answeredAt = Date.now();
            }
            const extra = stringeePhone.isTerminalState(state.code)
              ? {
                  talk_seconds: answeredAt ? Math.round((Date.now() - answeredAt) / 1000) : 0,
                  // The carrier's own answer (486 busy, 603 declined, 403 blocked...).
                  // "Ended" alone cannot say why a call died before ringing.
                  sip_code: state.sipCode ?? null,
                  sip_reason: state.sipReason ?? null,
                }
              : {};
            report(state.code, state.reason, c.callId, extra);
          },
        });

        if (callId) {
          // Bind the id server-side first, so /call_status by call_id never 404s.
          await report(stringeePhone.SDK_STATE.CALLING, "Calling", callId);
          dispatch(setCurrentCallId(callId));
        }
      } catch (e) {
        if (stringeePhone.isStringeeDown(e) && !reachedCustomer) {
          if (!stillParked()) {
            // Agent pressed END (or the call was replaced) while parked.
            stopWaiting();
            return;
          }
          if (!waiting) {
            waiting = true;
            dispatch(setStringeeWaiting(true));
            toastInfo(
              "Stringee service is down. Your call will start connecting once it comes back.",
            );
          }
          setTimeout(() => {
            if (stillParked()) attempt();
            else stopWaiting();
          }, RETRY_MS);
          return;
        }

        stopWaiting();
        toastError(e?.data?.detail || e?.message || "Stringee call failed");
        // Ends the row, so the disposition popup still opens.
        report(stringeePhone.SDK_STATE.ERROR, String(e?.message || e), null);
      }
    };

    attempt();
  }, [provider, mode, refId, fromNumber, toNumber, dispatch, getToken, sendEvent,
      toastError, toastInfo, toastSuccess]);
}
