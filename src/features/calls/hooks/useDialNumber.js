import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import { setCurrentLead } from "@/features/calls/slices/dialSlice";
import {
  CALL_STATE, selectIsCallBusy, setCallState, setCurrentCallFromDial, setIsCallbackDial,
} from "@/features/calls/slices/callSlice";
import { dialErrorMessage } from "@/features/calls/lib/dialError";
import { buildManualLead, isValidPhone, normalizePhone } from "@/features/calls/lib/manualDial";
import { useDialNextMutation } from "@/services";

/**
 * Dial one number the agent picked - the call page's manual-dial box and the
 * Reporting page's Call button both go through here, so a call started from
 * either is the same call: same /call request (lead lookup, Stringee or
 * VICIdial routing), same call state, same dispo afterwards.
 *
 * After a successful dial it opens /call when the agent is elsewhere: the call
 * page is what polls the call's state and opens the disposition box.
 */
export function useDialNumber() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isCallBusy = useSelector(selectIsCallBusy);
  const [dialNext, { isLoading: isDialing }] = useDialNextMutation();

  const dialNumber = useCallback(async (rawPhone) => {
    const phone = normalizePhone(rawPhone);
    if (!phone || !isValidPhone(phone)) {
      alert("Please enter a valid phone number.");
      return false;
    }
    try {
      dispatch(setCallState(CALL_STATE.DIALING));

      const res = await dialNext({ phone }).unwrap();

      if (res?.vicidial_response?.toLowerCase?.().includes("error")) {
        alert(res.vicidial_response);
        dispatch(setCallState(CALL_STATE.IDLE));
        return false;
      }
      dispatch(setCurrentCallFromDial(res));
      dispatch(setCurrentLead(buildManualLead(res?.details, phone)));
      dispatch(setIsCallbackDial(false)); // a manual call, not a callback
      dispatch(setCallState(CALL_STATE.INCALL));
      if (location.pathname !== "/call") navigate("/call");
      return true;
    } catch (e) {
      dispatch(setCallState(CALL_STATE.IDLE));
      alert(dialErrorMessage(e, "Failed to dial. Please try again."));
      return false;
    }
  }, [dialNext, dispatch, navigate, location.pathname]);

  return { dialNumber, isDialing, disabled: isDialing || isCallBusy };
}
