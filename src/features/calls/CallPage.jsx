import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ContactDetails from "./components/ContactDetails";
import CallDispositionPopup from "./components/CallDispositionPopup";
import AgentLeadsPanel from "./components/AgentLeadsPanel";
import CallbackListPanel from "./components/CallbackListPanel";
import UserTimelineChart from "./components/AgentTimelineChart";

import { useCallStatusQuery, useGetLogDataQuery, usePingQuery, useStatusDataQuery } from "@/services";
import { closeDispo, openDispo, CALL_STATE, PROVIDER, selectCallState, selectCurrentCall, selectShowDispo, setCurrentCallId, setIsCallbackDial } from "./slices/callSlice";
import { selectIsAdmin, selectUser } from "@/features/auth/slices/authSlice";
import { clearCurrentLead } from "./slices/dialSlice";
import TotalDialsToday from "@/shared/components/TotalDialsToday";
import { STRINGEE, stringeeGradient } from "@/shared/lib/stringeeBrand";

// The brand gradient, darkened so the existing glass cards stay readable.
const STRINGEE_BG = `${stringeeGradient("59")}, hsl(231 58% 6%)`;

export default function CallPage() {
  const isAdmin = useSelector(selectIsAdmin);
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { isPaused } = useSelector(e => e.dial);

  usePingQuery(undefined, {
    pollingInterval: 5000,
    skipPollingIfUnfocused: true,
    skip: isPaused
  });

  const callState = useSelector(selectCallState);
  const showDispo = useSelector(selectShowDispo);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!showDispo) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [showDispo]);

  const shouldPollLog = callState === CALL_STATE.INCALL || callState === CALL_STATE.ENDING;
  const [pollingEnabled, setPollingEnabled] = useState(false);

  // Which dialer is carrying this call. VICIdial unless the server said
  // otherwise, so the block below is unchanged for every existing call.
  const currentCall = useSelector(selectCurrentCall);
  const isStringee = currentCall.provider === PROVIDER.STRINGEE;

  const { data: callStatusData } = useStatusDataQuery(undefined, {
    skip: !shouldPollLog || isStringee,
    pollingInterval: 2000,
    refetchOnMountOrArgChange: true,
  });

  // Stringee's equivalent poller. A callout returns no call_id, so poll by our
  // own ref_id until the carrier's first event fills the real one in.
  const stringeeArgs = currentCall.id
    ? { call_id: currentCall.id }
    : currentCall.refId
      ? { ref_id: currentCall.refId }
      : null;

  const { data: lastStringeeStatus } = useCallStatusQuery(stringeeArgs ?? {}, {
    skip: !shouldPollLog || !isStringee || !stringeeArgs,
    pollingInterval: 2000,
    refetchOnMountOrArgChange: true,
  });

  // RTK Query's `data` keeps the last result for ANY args until the new args'
  // first response lands, so the moment a new call starts it still holds the
  // previous call — already `finished` — and the dispo popped up on a live
  // call. Only use a response that belongs to the call on screen.
  const stringeeStatus = useMemo(() => {
    const d = lastStringeeStatus?.data;
    if (!d) return undefined;
    const mine =
      (currentCall.refId && d.ref_id === currentCall.refId) ||
      (currentCall.id && d.call_id === currentCall.id);
    return mine ? lastStringeeStatus : undefined;
  }, [lastStringeeStatus, currentCall.refId, currentCall.id]);

  // Learn the carrier's call_id as soon as it exists — hangup and disposition
  // both need it.
  useEffect(() => {
    const id = stringeeStatus?.data?.call_id;
    if (id && !currentCall.id) dispatch(setCurrentCallId(id));
  }, [dispatch, stringeeStatus, currentCall.id]);

  const InCall_ReadyToDisconnect = isStringee
    ? shouldPollLog && ["ringing", "answered"].includes(stringeeStatus?.data?.status)
    : shouldPollLog && callStatusData
      ? callStatusData?.data?.call_status === "IN_CALL" || callStatusData?.data?.call_status === "RINGING"
      : false;

  useEffect(() => {
    if (isAdmin) return;
    if (isStringee) {
      // The call is over once Stringee says so — that is this provider's
      // DISPOSITION_PENDING.
      if (stringeeStatus?.data?.finished) dispatch(openDispo());
      return;
    }
    if (!callStatusData) return;
    if (callStatusData.data?.call_status === "DISPOSITION_PENDING") {
      dispatch(openDispo());
      return;
    }
  }, [dispatch, isAdmin, isStringee, callStatusData, stringeeStatus]);

  // Stringee theme while a Stringee call is live, so the agent can see at a
  // glance which dialer is carrying the call. Colours are Stringee's brand set
  // (#F5C50A0A is Android ARGB, i.e. red #C50A0A).
  const isStringeeLive =
    isStringee && (callState === CALL_STATE.INCALL || callState === CALL_STATE.ENDING);

  const handleCloseDispo = () => {
    dispatch(closeDispo());
    dispatch(setIsCallbackDial(false));
  };

  return (
    <div
      className="min-h-screen p-6 bg-[hsl(231_58%_6%)] text-white transition-[background] duration-500"
      style={isStringeeLive ? { background: STRINGEE_BG } : undefined}
    >
      {isStringeeLive && (
        <div
          className="mx-auto max-w-[1440px] mb-4 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg"
          style={{ background: STRINGEE.blue, boxShadow: `0 0 0 1px ${STRINGEE.red}` }}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: STRINGEE.red }} />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: STRINGEE.red }} />
          </span>
          Stringee call in progress
        </div>
      )}
      <div className="mx-auto max-w-[1440px] grid grid-cols-1 lg:grid-cols-12 gap-6 stagger-children">
        <div className="lg:col-span-12">
          <TotalDialsToday />
        </div>

        <div className="lg:col-span-8">
          <ContactDetails inCallLogData={InCall_ReadyToDisconnect}/>
        </div>
        <div className="lg:col-span-4">
          <AgentLeadsPanel />
        </div>
        <div className="lg:col-span-4">
          <CallbackListPanel />
        </div>
        <div className="lg:col-span-4">
          <UserTimelineChart />
        </div>
      </div>

      {showDispo && !isAdmin && <CallDispositionPopup closeDispo={handleCloseDispo} />}
    </div>
  );
}
