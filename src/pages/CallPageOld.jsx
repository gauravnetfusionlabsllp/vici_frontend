import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Phone, Search, Loader2 } from "lucide-react";
import {
  useCallHangupMutation,
  useDialNextMutation,
  useGetLeadsQuery,
  useGetLogDataQuery,
} from "../services/dashboardApi";
import CallDispositionPopup from "../components/CallDispositionPopup";

const CALL_STATE = {
  IDLE: "IDLE",
  DIALING: "DIALING",
  INCALL: "INCALL",
  ENDING: "ENDING", // user clicked hangup, but we keep polling logs until uniqueid
  DISPO: "DISPO",   // dispo popup open (polling should be stopped)
};

export default function CallPage() {
  const [startDate] = useState(new Date());
  const [endDate] = useState(new Date());
  const [pageSize] = useState(50);

  const user = JSON.parse(localStorage.getItem("user"))?.user;

  const [callState, setCallState] = useState(CALL_STATE.IDLE);
  const [showDispo, setShowDispo] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedNumber, setSelectedNumber] = useState("");
  const [activeNumber, setActiveNumber] = useState(null);
  const [open, setOpen] = useState(false);

  const inFlightRef = useRef(false);

  /**
   * ✅ Poll logs while:
   * - INCALL (call active)
   * - ENDING (hangup requested, waiting for log uniqueid)
   *
   * ✅ Stop polling when:
   * - DISPO (popup open)
   * - IDLE
   */
  const shouldPollLog =
    callState === CALL_STATE.INCALL || callState === CALL_STATE.ENDING;

  const { data: logData, refetch: refetchLog } = useGetLogDataQuery(user, {
    skip: !user,
    pollingInterval: shouldPollLog ? 2000 : 0,
    refetchOnMountOrArgChange: true,
  });

  // Leads list polling: you can stop during call/ending if you want
  const { data, isFetching } = useGetLeadsQuery(
    {
      sd: startDate.toISOString().split("T")[0],
      ed: endDate.toISOString().split("T")[0],
      limit: pageSize,
    },
    {
      pollingInterval:
        callState === CALL_STATE.INCALL || callState === CALL_STATE.ENDING
          ? 0
          : 30000,
      skipPollingIfUnfocused: true,
      refetchOnMountOrArgChange: true,
    }
  );

  const [dialNext, { isLoading: isCalling }] = useDialNextMutation();
  const [callHangup, { isLoading: isHangingUp }] = useCallHangupMutation();

  const numbers = useMemo(() => {
    return (
      data?.leads
        ?.map((l) => String(l.phone_number || "").trim())
        .filter(Boolean) || []
    );
  }, [data]);

  const filtered = useMemo(() => {
    const q = String(search || "").trim();
    if (!q) return numbers;
    return numbers.filter((n) => n.includes(q));
  }, [search, numbers]);

  const handleCall = useCallback(async () => {
    if (!selectedNumber || !user) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      // ✅ Hangup (keep log polling ON by moving to ENDING)
      if (callState === CALL_STATE.INCALL) {
        setCallState(CALL_STATE.ENDING);

        try {
          await (callHangup().unwrap?.() ?? callHangup());

          // IMPORTANT:
          // - Do NOT set IDLE
          // - Do NOT clear activeNumber yet
          // We continue polling logData until uniqueid appears.
          // Optional: force one immediate log fetch after hangup
          refetchLog?.();
        } catch (err) {
          console.error("Failed to Hangup", err);
          setCallState(CALL_STATE.INCALL);
        }
        return;
      }

      // block other actions while dialing/ending/dispo
      if (callState !== CALL_STATE.IDLE) return;

      // ✅ Start call
      setCallState(CALL_STATE.DIALING);

      const res = await dialNext(selectedNumber).unwrap();

      if (res?.vicidial_response?.toLowerCase?.().includes("error")) {
        alert(res.vicidial_response);
        setCallState(CALL_STATE.IDLE);
        return;
      }

      setActiveNumber(selectedNumber);
      setCallState(CALL_STATE.INCALL);
    } catch (err) {
      console.error("Call failed:", err);
      setCallState(CALL_STATE.IDLE);
    } finally {
      inFlightRef.current = false;
    }
  }, [selectedNumber, user, callState, callHangup, dialNext, refetchLog]);

  /**
   * ✅ Decide when call ended from logData:
   * You said: uniqueid indicates hangup/completion.
   * We'll wait for uniqueid AFTER hangup OR during call.
   */
  useEffect(() => {
   
    if (logData?.inCall) return;
    setCallState(CALL_STATE.DISPO); 
    setShowDispo(true);
  }, [logData]);

  /**
   * ✅ After dispo submitted/closed:
   * stop polling, reset state.
   * (CallDispositionPopup should call this)
   */
  const closeDispo = () => {

    setShowDispo(false);
    setCallState(CALL_STATE.IDLE); // polling OFF
    setActiveNumber(null);
    setSelectedNumber("");
    setSearch("");
  };

  const isBusy =
    callState === CALL_STATE.DIALING ||
    isCalling ||
    isHangingUp;

  const isInCall = callState === CALL_STATE.INCALL;
  const isEnding = callState === CALL_STATE.ENDING;

  return (
    <div className="p-6 min-h-screen bg-[hsl(231_58%_6%)] text-white">
      <div className="max-w-xl mx-auto mt-20 bg-[hsl(229_56%_13%)] p-6 rounded-2xl border border-white/10 shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Call Panel</h2>

        {/* Dropdown */}
        {/* <div className="relative">
          <div
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 bg-slate-900 border border-white/10 px-3 py-2 rounded-lg cursor-pointer"
          >
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              disabled={callState !== CALL_STATE.IDLE}
              onChange={(e) => {
                const v = e.target.value;
                setSearch(v);
                setSelectedNumber(v);
                setOpen(true);
              }}
              placeholder="Search or type number..."
              className="bg-transparent outline-none flex-1 text-sm"
            />
          </div>

          {open && (
            <div className="absolute z-50 mt-1 w-full max-h-52 overflow-auto bg-slate-950 border border-white/10 rounded-lg">
              {isFetching && <p className="p-3 text-sm text-slate-400">Loading...</p>}

              {!isFetching &&
                filtered.map((num, i) => (
                  <div
                    key={`${num}-${i}`}
                    onClick={() => {
                      setSelectedNumber(num);
                      setSearch(num);
                      setOpen(false);
                    }}
                    className="px-3 py-2 hover:bg-indigo-600/20 cursor-pointer text-sm"
                  >
                    {num}
                  </div>
                ))}

              {!isFetching && filtered.length === 0 && (
                <p className="p-3 text-sm text-slate-500">Use typed number</p>
              )}
            </div>
          )}
        </div> */}

        {/* Selected */}
        {/* <p className="mt-3 text-sm text-slate-400">
          Selected: <span className="text-white">{selectedNumber || "-"}</span>
        </p> */}

        {/* <p className="mt-1 text-xs text-slate-500">
          Active: <span className="text-slate-200">{activeNumber || "-"}</span>
        </p> */}

        {/* Call/Hangup Button */}
        <button
          onClick={handleCall}
          disabled={!selectedNumber || isBusy || callState === CALL_STATE.DISPO}
          className={`mt-5 w-full py-2 rounded-lg ${
            isInCall || isEnding
              ? "bg-red-600/20 text-red-400 hover:bg-red-700"
              : "bg-green-600/20 text-green-400 hover:bg-green-700"
          } flex items-center justify-center gap-2 disabled:opacity-50`}
        >
          {isBusy ? <Loader2 className="animate-spin" size={18} /> : <Phone size={18} />}
          {isInCall ? "Disconnect" : isEnding ? "Disconnecting..." : "Next Call"}
        </button>

        {showDispo && (
          <CallDispositionPopup closeDispo={closeDispo} />
        )}
      </div>
    </div>
  );
}
