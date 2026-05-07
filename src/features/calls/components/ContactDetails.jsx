import { memo, useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, PhoneOff, X, MoreHorizontal, Pencil, Calendar, Building2, BadgeInfo, Phone } from "lucide-react";
import { selectCurrentLead, setCurrentLead } from "@/features/calls/slices/dialSlice";
import { CALL_STATE, selectCallState, selectIsCallBusy, setCallState, setIsCallbackDial } from "@/features/calls/slices/callSlice";
import { useCallHangupMutation, useDialNextMutation } from "@/services";
function normalizePhone(raw) {
  if (!raw) return "";
  // keep + and digits
  return String(raw).replace(/[^\d+]/g, "").trim();
}

function isValidPhone(p) {
  // basic: must have at least 6 digits
  const digits = String(p || "").replace(/[^\d]/g, "");
  return digits.length >= 6;
}
const MANUAL_DEFAULT_LEAD = {
  phone_number: "",
  first_name: "Manual",
  last_name: "Call",
  city: "—",
  lead_id: "—",
  entry_date: "—",
  list_id: "—",
};

function buildManualLead(details, phone) {
  const d = details && typeof details === "object" ? details : {};

  const out = {
    ...MANUAL_DEFAULT_LEAD,
    ...d, // take whatever backend gives
  };

  // always override with the number the agent typed
  out.phone_number = phone;

  // ensure key fields are not empty/undefined
  if (!out.first_name?.trim?.()) out.first_name = "Manual";
  if (!out.last_name?.trim?.()) out.last_name = "Call";

  // city can be empty => show —
  if (!out.city?.trim?.()) out.city = "—";

  // ids/dates/list should not be undefined/null
  if (out.lead_id === null || out.lead_id === undefined || out.lead_id === "") out.lead_id = "—";
  if (!out.entry_date) out.entry_date = "—";
  if (out.list_id === null || out.list_id === undefined || out.list_id === "") out.list_id = "—";

  return out;
}
function ContactDetails({inCallLogData}) {
  const dispatch = useDispatch();

  const lead = useSelector(selectCurrentLead);
  const callState = useSelector(selectCallState);
  const isCallBusy = useSelector(selectIsCallBusy);
  const [callHangup, { isLoading: isHangingUp }] = useCallHangupMutation();
  const [dialNext, { isLoading: isDialing }] = useDialNextMutation();
  const [notes, setNotes] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const isInCall = callState === CALL_STATE.INCALL;
  const isEnding = callState === CALL_STATE.ENDING;
  const isBusy = isHangingUp || callState === CALL_STATE.DIALING;
  const disabledAll = isDialing || isCallBusy;
  const initials = useMemo(() => {
    const a = lead?.first_name?.[0] ?? "";
    const b = lead?.last_name?.[0] ?? "";
    return (a + b).toUpperCase() || "C";
  }, [lead]);

  const displayName = useMemo(() => {
    if (!lead) return "No Active Lead";
    return `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() || "Unknown";
  }, [lead]);

  const locationText = useMemo(() => {
    const city = lead?.city?.trim();
    return city ? city : "—";
  }, [lead]);

  const handleManualDial = useCallback(async () => {
    try {
      const phone = normalizePhone(manualPhone);
      if (!phone || !isValidPhone(phone)) {
        alert("Please enter a valid phone number.");
        return;
      }

      dispatch(setCallState(CALL_STATE.DIALING));

      const res = await dialNext({ phone }).unwrap();

      if (res?.vicidial_response?.toLowerCase?.().includes("error")) {
        alert(res.vicidial_response);
        dispatch(setCallState(CALL_STATE.IDLE));
        return;
      }
      const safeLead = buildManualLead(res?.details, phone);
      dispatch(setCurrentLead(safeLead));
      dispatch(setIsCallbackDial(false)); // ✅ manual call
      dispatch(setCallState(CALL_STATE.INCALL));
    } catch (e) {
      dispatch(setCallState(CALL_STATE.IDLE));
      alert("Failed to dial. Please try again.");
    }
  }, [manualPhone, dialNext, dispatch, lead]);

  const handleEndCall = async () => {
    if (!isInCall && !inCallLogData) return;

    dispatch(setCallState(CALL_STATE.ENDING)); // ✅ keep log polling ON
    try {
      await (callHangup().unwrap?.() ?? callHangup());
      // DO NOT set IDLE here. Wait for log uniqueid -> dispo popup
    } catch (e) {
      dispatch(setCallState(CALL_STATE.INCALL));
      alert("Failed to end call.");
    }
  };
  const manualHasNumber = isValidPhone(normalizePhone(manualPhone));
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10
                 bg-gradient-to-b from-slate-900/70 to-slate-950/80
                 shadow-[0_30px_120px_rgba(0,0,0,0.55)] transition-smooth"
    >
      {/* soft glow like screenshot */}
      <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(700px_circle_at_15%_0%,rgba(56,189,248,0.16),transparent_55%),radial-gradient(700px_circle_at_90%_10%,rgba(168,85,247,0.14),transparent_55%)]" />

      {/* Header bar */}
      <div className="relative flex items-center justify-between px-5 py-3 border-b border-white/10">
        <div className="flex items-center gap-3 text-slate-100">
          <div className="h-2.5 w-2.5 rounded-full border border-sky-300/40 bg-sky-500/20" />
          <div className="text-sm font-semibold tracking-wide">Contact Details</div>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={manualPhone}
            onChange={(e) => setManualPhone(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !disabledAll && manualHasNumber) handleManualDial();
            }}
            placeholder="Manual dial number…"
            className="w-full md:w-56 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs
                       text-slate-100 placeholder:text-slate-500
                       focus:outline-none focus:ring-2 focus:ring-sky-500/25"
          />

          <button
            type="button"
            disabled={disabledAll || !manualHasNumber}
            onClick={handleManualDial}
            className={[
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold",
              "border transition-colors",
              disabledAll || !manualHasNumber
                ? "border-white/10 bg-white/5 text-slate-500 cursor-not-allowed"
                : "border-emerald-600/40 bg-emerald-600/20 text-emerald-200 hover:bg-emerald-600/30 hover:text-emerald-100 active:bg-emerald-600/40",
            ].join(" ")}
            title={
              !manualHasNumber
                ? "Enter a valid number"
                : disabledAll
                ? "Dialing or call busy"
                : "Call this number"
            }
          >
            {isDialing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Calling…
              </>
            ) : (
              <>
                <Phone className="h-4 w-4" />
                Call
              </>
            )}
          </button>
        </div>

      </div>

      {/* Main */}
      <div className="relative px-6 py-5">
        {!lead ? (
          <div className="text-slate-300 animate-fade-in">
            No active lead. Click <span className="text-cyan-200 font-semibold">DIAL NEXT</span>.
          </div>
        ) : (
          <div key={lead.lead_id ?? lead.phone_number} className="animate-fade-in">
            {/* Top identity row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="relative">
                  <div className="h-20 w-20 rounded-full border border-white/10 bg-slate-950/25 grid place-items-center text-2xl font-bold text-slate-100">
                    {initials}
                  </div>
                  <div className="absolute -right-1 -bottom-1 h-7 w-7 rounded-full border border-white/10 bg-slate-900/70 grid place-items-center">
                    <span className="text-xs font-bold text-sky-200">C</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-semibold text-slate-100 tracking-wide">
                      {displayName}
                    </div>

                    {/* Active badge like screenshot */}
                    <div className="rounded-full border border-sky-300/25 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">
                      Active
                    </div>

                    <button className="h-9 w-9 grid place-items-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition">
                      <Pencil className="w-4 h-4 text-slate-200" />
                    </button>
                  </div>

                  <div className="mt-1 text-sm text-slate-400">
                    {locationText}
                  </div>

                  {/* light "meta" row */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <BadgeInfo className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400">Lead ID</span>
                      <span className="text-slate-100 font-semibold">{lead.lead_id}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400">Entry Date</span>
                      <span className="text-slate-100 font-semibold">{lead.entry_date ?? "—"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400">List</span>
                      <span className="text-slate-100 font-semibold">{lead.list_id ?? "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right "Hidden" pill (visual only like screenshot) */}
              <button className="hidden md:flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-slate-200 hover:bg-white/10 transition">
                <span className="text-sm font-semibold tracking-wide">HIDDEN</span>
                <span className="text-slate-400">›</span>
              </button>
            </div>

            {/* Bottom action row like screenshot */}
            <div className="mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2">
              </div>

              {/* END CALL (real logic) */}
              <button
                onClick={handleEndCall}
                disabled={!lead || !isInCall || isBusy || callState === CALL_STATE.DISPO || !inCallLogData}
                className={`rounded-xl border px-5 py-2.5 font-semibold flex items-center justify-center gap-2 transition-smooth active:scale-[0.97]
                  ${
                    isInCall || isEnding
                      ? "border-rose-400/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15"
                      : "border-white/10 bg-white/5 text-white/40"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isEnding || isHangingUp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PhoneOff className="w-4 h-4" />
                )}
                {isEnding ? "ENDING..." : "END CALL"}
              </button>
            </div>

            {/* Debug status line (optional) */}
            <div className="mt-4 text-xs text-white/40">
              Call State: <span className="text-white/60">{callState}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ContactDetails);
