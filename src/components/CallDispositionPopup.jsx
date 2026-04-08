import React, { useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MessageCircle, MessageSquare } from "lucide-react";
import { useSubmitStatusMutation, useDialNextMutation, useSendMessageMutation } from "../services/dashboardApi";
import {  CALL_STATE, selectIsCallBusy, setCallState ,selectIsCallbackDial} from "../slices/callSlice";
import { clearCurrentLead, selectCurrentLead, setCurrentLead } from "../slices/dialSlice";
import { useToast } from "../customHooks/useToast";
import { tr } from "date-fns/locale";


const DISPOSITIONS = [
  { label: "Busy", value: "B" },
  { label: "Completed", value: "C" },
  { label: "No Answer", value: "N" },
  { label: "Not Interested", value: "NI" },
  { label: "Callback", value: "CBR" },
  { label: "Converted", value: "CON" },
  { label: "Disconnected", value: "D" },
  { label: "Interested", value: "IN" },
  { label: "Invalid Number", value: "INVN" },
  { label: "Wrong Number", value: "WN" },
];

// ✅ yyyy dd mm time (HH:mm:ss)
const formatCallbackDateTime = (date) => {
  if (!date) return null;
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const dd = pad(date.getDate());
  const mm = pad(date.getMonth() + 1);
  const HH = pad(date.getHours());
  const MM = pad(date.getMinutes());
  const SS = pad(date.getSeconds());
  return `${yyyy}-${mm}-${dd}+${HH}:${MM}:${SS}`;
};

export default function CallDispositionPopup({ closeDispo, leadName = "Customer" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { success, error, info } = useToast();
  const isCallBusy = useSelector(selectIsCallBusy);
const isCallbackDialed = useSelector(selectIsCallbackDial)
  const [submitStatus, { isLoading: submitting }] = useSubmitStatusMutation();
  const [dialNext, { isLoading: isDialing }] = useDialNextMutation();
const [sendMessage] = useSendMessageMutation();
  const [selectedStatus, setSelectedStatus] = useState(null);

  const [callbackDateTime, setCallbackDateTime] = useState(null);
  const [callbackComments, setCallbackComments] = useState("");
  const [sendReminderEmail, setSendReminderEmail] = useState(false);

  const isCallback = selectedStatus?.value === "CBR";
  const lead = useSelector(selectCurrentLead);

  const phoneNumber = lead?.phone_number
    ? lead.phone_number.replace(/\D/g, "") // remove +, spaces, etc.
    : null;
  
  const handleWhatsApp = () => {
    if (!phoneNumber) return;
    const url = `https://wa.me/${phoneNumber}`;
    window.open(url, "_blank");
  };
  const handleSendSMS = async () => {
    try {
      if (!phoneNumber) {
        error("No valid phone number to send SMS.");
        return};
      await sendMessage(phoneNumber).unwrap();
      success("SMS sent successfully");
    } catch (err) {
      error("Failed to send SMS");
    }
  };
  const canSubmit = useMemo(() => {
    if (!selectedStatus) return false;
    if (!isCallback) return true;
    return !!callbackDateTime; // require datetime for callback
  }, [selectedStatus, isCallback, callbackDateTime]);

  const buildPayload = () => {
    const payload = { status: selectedStatus.value };

    if (selectedStatus.value === "CBR") {
      payload.callback_datetime = callbackDateTime
        ? formatCallbackDateTime(callbackDateTime)
        : null;
      payload.callback_comments = callbackComments?.trim() || "";
      payload.send_reminder_email = !!sendReminderEmail; // keep/remove if API doesn't need
    }

    return payload;
  };

  const submitOnly = async () => {
    if (!canSubmit) return false;

    await submitStatus(buildPayload()).unwrap();

    // reset local
    setSelectedStatus(null);
    setCallbackDateTime(null);
    setCallbackComments("");
    setSendReminderEmail(false);
    dispatch(clearCurrentLead())
    return true;
  };

  const handleSubmitAndClose = async () => {
    try {
      const ok = await submitOnly();
      if (!ok) return;
      dispatch(setCallState(CALL_STATE.IDLE));
      closeDispo?.();
    } catch (e) {
      console.error(e);
      alert("Failed to submit disposition.");
    }
  };
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const handleWrapAndNext = async () => {
    try {
      const ok = await submitOnly();
      if (!ok) return;
      await sleep(5000);
      dispatch(setCallState(CALL_STATE.DIALING));
      const res = await dialNext({}).unwrap();

      if (res?.vicidial_response?.toLowerCase?.().includes("error")) {
        alert(res.vicidial_response);
        dispatch(setCallState(CALL_STATE.IDLE));
        return;
      }

      dispatch(setCurrentLead(res?.details ?? null));
      dispatch(setCallState(CALL_STATE.INCALL));
      // navigate("/call");
      // await sleep(5000);
      closeDispo?.();
    } catch (e) {
      console.error(e);
      dispatch(setCallState(CALL_STATE.IDLE));
      alert("Failed to wrap & dial next.");
    }
  };

  // UI helpers
  const TopTabs = [
    { label: "Interested", value: "IN", tone: "green" },
    { label: "Not Interested", value: "NI", tone: "slate" },
    { label: "Unreachable", value: "N", tone: "slate" },
    { label: "Callback", value: "CBR", tone: "blue" },
  ];

  const tabClass = (active, tone) => {
    const base =
      "w-full rounded-lg px-4 py-2 text-sm font-medium border transition " +
      "bg-slate-950/25 hover:bg-slate-950/40 border-white/10 text-slate-200";
    if (!active) return base;

    if (tone === "green")
      return "w-full rounded-lg px-4 py-2 text-sm font-semibold border transition " +
        "bg-emerald-500/15 border-emerald-400/25 text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.15)]";
    if (tone === "blue")
      return "w-full rounded-lg px-4 py-2 text-sm font-semibold border transition " +
        "bg-sky-500/15 border-sky-300/25 text-sky-100 shadow-[0_0_24px_rgba(56,189,248,0.15)]";

    return "w-full rounded-lg px-4 py-2 text-sm font-semibold border transition " +
      "bg-indigo-500/15 border-indigo-300/25 text-indigo-100 shadow-[0_0_24px_rgba(99,102,241,0.15)]";
  };
  const handleCloseDispo = () => {
    closeDispo?.();
    dispatch(setCallState(CALL_STATE.IDLE));
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4">
      <div
        className="w-full max-w-[860px] max-h-[700px] rounded-2xl border border-white/10 overflow-y-scroll
                   bg-gradient-to-b from-slate-900/70 to-slate-950/80 shadow-[0_30px_120px_rgba(0,0,0,0.65)]"
      >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-white/10">
          <div className="absolute inset-0 opacity-60 bg-[radial-gradient(600px_circle_at_20%_0%,rgba(56,189,248,0.18),transparent_50%),radial-gradient(700px_circle_at_90%_20%,rgba(168,85,247,0.15),transparent_55%)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-slate-100 tracking-wide">
                Call Disposition Options
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                Call with <span className="font-semibold text-slate-100">{leadName}</span> has been ended.
              </p>
            </div>

            {/* <button
              onClick={handleCloseDispo}
              className="h-9 w-9 rounded-lg border border-white/10 bg-slate-950/20 text-slate-300
                         hover:bg-slate-950/40 hover:text-slate-100 transition grid place-items-center"
              aria-label="Close"
            >
              ✕
            </button> */}
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Top tab row (like screenshot) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {TopTabs.map((t) => (
              <button
                key={t.value}
                onClick={() => setSelectedStatus(DISPOSITIONS.find((x) => x.value === t.value))}
                className={tabClass(selectedStatus?.value === t.value, t.tone)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Notes */}
          <div className="mt-4">
            <div className="text-sm text-slate-300 mb-2">
              Follow-up Notes <span className="text-slate-500">(optional)</span>
            </div>
            <textarea
              value={callbackComments}
              onChange={(e) => setCallbackComments(e.target.value)}
              rows={3}
              placeholder="Add notes..."
              className="w-full rounded-xl border border-white/10 bg-slate-950/25 px-4 py-3
                         text-slate-100 placeholder:text-slate-500 focus:outline-none
                         focus:ring-2 focus:ring-sky-500/30"
            />
          </div>

          {/* Callback date row + toggle row (only when CBR) */}
          {isCallback && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3
                              rounded-xl border border-white/10 bg-slate-950/20 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg border border-white/10 bg-slate-950/25 grid place-items-center">
                    📅
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">Callback Date &amp; Time</div>
                    <div className="text-xs text-slate-400">
                      Select one date and time for callback
                    </div>
                  </div>
                </div>

                <DatePicker
                  selected={callbackDateTime}
                  onChange={(d) => setCallbackDateTime(d)}
                  showTimeSelect
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="EEE, MMM d, yyyy · h:mm aa"
                  minDate={new Date()}
                  className="w-full md:w-[340px] rounded-lg border border-white/10 bg-slate-950/30 px-3 py-2
                             text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  popperClassName="z-[70]"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/20 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg border border-white/10 bg-slate-950/25 grid place-items-center">
                    ✉️
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">Send Reminder Email</div>
                    <div className="text-xs text-slate-400">Optional</div>
                  </div>
                </div>

                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => setSendReminderEmail((s) => !s)}
                  className={[
                    "relative inline-flex h-7 w-12 items-center rounded-full border transition",
                    sendReminderEmail
                      ? "bg-emerald-500/25 border-emerald-400/30"
                      : "bg-slate-800/50 border-white/10",
                  ].join(" ")}
                  aria-pressed={sendReminderEmail}
                >
                  <span
                    className={[
                      "inline-block h-6 w-6 transform rounded-full bg-white transition",
                      sendReminderEmail ? "translate-x-5" : "translate-x-1",
                    ].join(" ")}
                  />
                </button>
              </div>

              {!callbackDateTime && (
                <div className="text-xs text-amber-300/90">
                  Please select a callback date &amp; time.
                </div>
              )}
            </div>
          )}

          {/* Summary strip (like screenshot bottom row) */}
          <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/18 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-slate-500">Selected</span>
                <span className="text-sm font-semibold text-slate-100">
                  {selectedStatus ? selectedStatus.label : "—"}
                </span>
                {selectedStatus?.value && (
                  <span className="text-xs text-slate-400">({selectedStatus.value})</span>
                )}
              </div>

              {isCallback && callbackDateTime ? (
                <div className="text-sm text-slate-200">
                  <span className="text-slate-400 mr-2">Callback:</span>
                  {callbackDateTime.toLocaleString()}
                </div>
              ) : (
                <div className="text-sm text-slate-500"> </div>
              )}
            </div>
          </div>

          {/* Optional: compact grid of all dispositions (still looks clean) */}
          <div className="mt-5">
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">All dispositions</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {DISPOSITIONS.map((d) => {
                const active = selectedStatus?.value === d.value;
                return (
                  <button
                    key={d.value}
                    onClick={() => setSelectedStatus(d)}
                    className={[
                      "rounded-xl border px-3 py-2 text-left transition",
                      active
                        ? "bg-sky-500/12 border-sky-300/25 text-sky-100 shadow-[0_0_22px_rgba(56,189,248,0.10)]"
                        : "bg-slate-950/20 border-white/10 text-slate-200 hover:bg-slate-950/35",
                    ].join(" ")}
                  >
                    <div className="text-sm font-semibold">{d.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{d.value}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        {/* Footer buttons */}
<div className="px-6 py-5 border-t border-white/10 bg-slate-950/25">
<div className="flex flex-col md:flex-row gap-3">
  {/* Submit */}
  <button
    onClick={handleSubmitAndClose}
    disabled={!canSubmit || submitting || isDialing}
    className="w-full md:w-1/2 rounded-xl border border-white/10 bg-slate-950/20 px-4 py-3
               text-slate-100 font-semibold hover:bg-slate-950/35 transition disabled:opacity-50"
  >
    {submitting ? "Saving..." : "Submit & Close"}
  </button>

  {/* SMS + WhatsApp */}
  <div className="w-full md:w-1/2 flex gap-3">
    {/* Send SMS */}
    <button
      onClick={handleSendSMS}
      // disabled={!phoneNumber}
      disabled={true}
      className="flex-1 flex items-center justify-center gap-2
                 rounded-xl px-4 py-3 font-semibold
                 bg-blue-600 text-white
                 hover:bg-blue-700 transition disabled:opacity-40"
    >
      <MessageSquare size={18} strokeWidth={2.2} />
      <span>SMS</span>
    </button>

    {/* WhatsApp */}
    <button
      onClick={handleWhatsApp}
      // disabled={!phoneNumber}
      disabled={true}
      className="flex-1 flex items-center justify-center gap-2
                 rounded-xl px-4 py-3 font-semibold
                 bg-[#25D366] text-white
                 hover:bg-[#1EBE5D] transition disabled:opacity-40"
    >
      <MessageCircle size={18} strokeWidth={2.2} />
      <span>WhatsApp</span>
    </button>
  </div>

    {/* {!isCallbackDialed && <button
              onClick={handleWrapAndNext}
              disabled={!canSubmit || submitting }
              className="w-full md:w-1/2 rounded-xl border border-rose-300/15 px-4 py-3 font-semibold
                         bg-gradient-to-r from-rose-900/75 via-pink-900/55 to-rose-900/75
                         text-rose-50 hover:from-rose-900/90 hover:via-pink-900/70 hover:to-rose-900/90
                         transition disabled:opacity-50"
            >
              {isDialing ? "Dialing..." : "Wrap & Go To Next Call →"}
            </button>} */}
  </div>

  {/* tiny hint */}
  <div className="mt-3 text-xs text-slate-500">
    Tip: Callback requires date &amp; time.
  </div>
</div>

      </div>
    </div>
  );
}
