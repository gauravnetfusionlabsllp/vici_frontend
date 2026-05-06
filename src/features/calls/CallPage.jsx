import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ContactDetails from "./components/ContactDetails";
import CallDispositionPopup from "./components/CallDispositionPopup";
import AgentLeadsPanel from "./components/AgentLeadsPanel";
import CallbackListPanel from "./components/CallbackListPanel";
import UserTimelineChart from "./components/AgentTimelineChart";

import { useGetLogDataQuery, usePingQuery, useStatusDataQuery } from "@/services";
import { closeDispo, openDispo, CALL_STATE, selectCallState, selectShowDispo, setIsCallbackDial } from "./slices/callSlice";
import { selectIsAdmin, selectUser } from "@/features/auth/slices/authSlice";
import { clearCurrentLead } from "./slices/dialSlice";
import TotalDialsToday from "@/shared/components/TotalDialsToday";

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

  const { data: callStatusData } = useStatusDataQuery(undefined, {
    skip: !shouldPollLog,
    pollingInterval: 2000,
    refetchOnMountOrArgChange: true,
  });

  const InCall_ReadyToDisconnect = shouldPollLog && callStatusData
    ? callStatusData?.data?.call_status === "IN_CALL" || callStatusData?.data?.call_status === "RINGING"
    : false;

  useEffect(() => {
    if (!callStatusData || isAdmin) return;
    if (callStatusData.data?.call_status === "DISPOSITION_PENDING") {
      dispatch(openDispo());
      return;
    }
  }, [dispatch, isAdmin, callStatusData]);

  const handleCloseDispo = () => {
    dispatch(closeDispo());
    dispatch(setIsCallbackDial(false));
  };

  return (
    <div className="min-h-screen p-6 bg-[hsl(231_58%_6%)] text-white">
      <div className="mx-auto max-w-[1440px] grid grid-cols-1 lg:grid-cols-12 gap-6">
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
