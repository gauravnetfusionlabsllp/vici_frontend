import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import { selectCampaingName, selectIsAdmin, selectUser } from "@/features/auth/slices/authSlice";
import { resetAutoDialTime, selectFormNameFilter, setCurrentLead } from "@/features/calls/slices/dialSlice";
import { CALL_STATE, selectIsCallBusy, setCallState } from "@/features/calls/slices/callSlice";
import { useDialNextMutation } from "@/services";
import { useToast } from "@/shared/hooks/useToast";

const HOT_METAL_CAMPAIGN = "HotMetaleads";

/**
 * Agent auto-dial engine: counts down to `autoDialTime` and fires the next dial
 * when it hits zero, or immediately via `dialNow()`.
 *
 * Owns a live interval, so it must be mounted EXACTLY ONCE in the tree
 * (currently TopBar). Consumers render from the returned state.
 */
export function useAutoDial() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);
  const isCallBusy = useSelector(selectIsCallBusy);
  const campaignName = useSelector(selectCampaingName);
  const formNameFilter = useSelector(selectFormNameFilter);
  const isAvailableLeads = useSelector((s) => s.dial.isAvailableLeads);
  const { isPaused, autoDialTime } = useSelector((s) => s.dial);

  const isHotMetal = campaignName === HOT_METAL_CAMPAIGN;
  const [dialNext, { isLoading: isDialing }] = useDialNextMutation();
  const [nextDialIn, setNextDialIn] = useState(30);
  const dialLockRef = useRef(false);

  // Read the filter through a ref so the dial callback doesn't re-create (and
  // restart the countdown) every time the form filter changes.
  const formNameFilterRef = useRef(formNameFilter);
  useEffect(() => {
    formNameFilterRef.current = formNameFilter;
  }, [formNameFilter]);

  const handleDialNext = useCallback(async () => {
    if (isCallBusy || isDialing) return;
    dialLockRef.current = true;
    setNextDialIn(0);
    try {
      dispatch(setCallState(CALL_STATE.DIALING));

      const currentFormName = formNameFilterRef.current;
      const dialParams = isHotMetal && currentFormName ? { form_name: currentFormName } : {};

      const res = await dialNext(dialParams).unwrap();

      if (res?.vicidial_response?.toLowerCase?.().includes("error")) {
        toastError(res.vicidial_response);
        dispatch(setCallState(CALL_STATE.IDLE));
        return;
      }
      dispatch(setCurrentLead(res?.details ?? null));
      dispatch(setCallState(CALL_STATE.INCALL));
      navigate("/call");
      dispatch(resetAutoDialTime());
    } catch {
      dispatch(setCallState(CALL_STATE.IDLE));
      toastError("Failed to dial next. Please try again.");
      dispatch(resetAutoDialTime());
    }
  }, [isCallBusy, isDialing, isHotMetal, dialNext, dispatch, navigate, toastError]);

  useEffect(() => {
    if (isAdmin || !user) return;
    if (isPaused || isCallBusy || isDialing || !isAvailableLeads) return;

    const target = dayjs(autoDialTime);
    if (!target.isValid()) return;

    const initial = target.diff(dayjs(), "seconds");

    if (initial <= 0) {
      dispatch(resetAutoDialTime());
      return;
    }

    dialLockRef.current = false;
    setNextDialIn(initial);

    const timer = setInterval(() => {
      const remaining = target.diff(dayjs(), "seconds");
      setNextDialIn(Math.max(0, remaining));

      if (remaining <= 0 && !dialLockRef.current) {
        dialLockRef.current = true;
        handleDialNext();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    autoDialTime,
    isPaused,
    isCallBusy,
    isDialing,
    isAdmin,
    user,
    isAvailableLeads,
    handleDialNext,
    dispatch,
  ]);

  useEffect(() => {
    if (isAdmin) return;
    if (!isCallBusy && !isPaused && !isDialing) {
      dispatch(resetAutoDialTime());
    }
  }, [isCallBusy, isPaused, isDialing, dispatch, isAdmin]);

  const dialNow = useCallback(() => {
    dispatch(resetAutoDialTime());
    return handleDialNext();
  }, [dispatch, handleDialNext]);

  return {
    dialNow,
    nextDialIn,
    isDialing,
    isPaused,
    isCallBusy,
    isAvailableLeads,
    disabled: isDialing || isCallBusy || isPaused || !isAvailableLeads,
  };
}
