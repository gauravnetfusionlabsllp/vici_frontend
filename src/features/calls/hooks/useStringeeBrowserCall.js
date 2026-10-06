import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { PROVIDER, selectCurrentCall, setCurrentCallId } from "@/features/calls/slices/callSlice";
import { useStringeeClientEventMutation, useStringeeClientTokenMutation } from "@/services";
import { useToast } from "@/shared/hooks/useToast";
import * as stringeePhone from "@/features/calls/lib/stringeePhone";

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
 * Must be mounted EXACTLY ONCE (TopBar, next to useAutoDial).
 */
export function useStringeeBrowserCall() {
  const dispatch = useDispatch();
  const call = useSelector(selectCurrentCall);
  const [getToken] = useStringeeClientTokenMutation();
  const [sendEvent] = useStringeeClientEventMutation();
  const { error: toastError } = useToast();
  const startedRef = useRef(null);

  const { provider, mode, refId, fromNumber, toNumber } = call;

  useEffect(() => {
    if (provider !== PROVIDER.STRINGEE || mode !== "browser" || !refId) return;
    if (startedRef.current === refId) return;
    startedRef.current = refId;

    let answeredAt = null;
    const report = (code, reason, callId, extra = {}) =>
      sendEvent({ ref_id: refId, call_id: callId || null, code, reason, ...extra })
        .unwrap()
        .catch(() => {});

    (async () => {
      try {
        await stringeePhone.connect(() => getToken().unwrap());

        const callId = await stringeePhone.dial({
          from: fromNumber,
          to: toNumber,
          custom: JSON.stringify({ ref: refId }),
          onState: (state, c) => {
            if (state.code === stringeePhone.SDK_STATE.ANSWERED) answeredAt = Date.now();
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
        toastError(e?.data?.detail || e?.message || "Stringee call failed");
        // Ends the row, so the disposition popup still opens.
        report(stringeePhone.SDK_STATE.ERROR, String(e?.message || e), null);
      }
    })();
  }, [provider, mode, refId, fromNumber, toNumber, dispatch, getToken, sendEvent, toastError]);
}
