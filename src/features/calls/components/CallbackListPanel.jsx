import React, { useCallback } from "react";
import { Phone, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import { useGetAgentWiseLeadQuery, useDialNextMutation } from "@/services";
import { setCurrentLead } from "@/features/calls/slices/dialSlice";
import { CALL_STATE, selectIsCallBusy, setCallState, setIsCallbackDial } from "@/features/calls/slices/callSlice";
import { SkeletonAvatarRow } from "@/shared/components/ui";

function safeText(v) {
  if (v === null || v === undefined) return "—";
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "nan") return "—";
  return s;
}

function initials(first, last) {
  const f = safeText(first);
  const l = safeText(last);
  const a = f !== "—" ? f[0] : "";
  const b = l !== "—" ? l[0] : "";
  const out = (a + b).toUpperCase();
  return out || "??";
}

function formatDate(d) {
  if (!d) return "—";
  const s = String(d);
  const date = new Date(s.includes("T") ? s : `${s}T00:00:00`);
  if (Number.isNaN(date.getTime())) return safeText(d);
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(d) {
  if (!d) return "—";
  const s = String(d);
  const date = new Date(s);
  if (Number.isNaN(date.getTime())) return safeText(d);
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPhone(raw) {
  const s = safeText(raw);
  if (s === "—") return "—";
  const cleaned = String(raw).replace(/[^\d+]/g, "");
  return cleaned || s;
}

function badgeClass(status) {
  const s = String(status || "").toUpperCase();
  if (s.includes("HOLD")) return "bg-amber-500/10 text-amber-300 border-amber-500/20";
  if (s.includes("CALLBK") || s.includes("CB")) return "bg-sky-500/10 text-sky-300 border-sky-500/20";
  if (s.includes("SALE") || s.includes("QUAL")) return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
  return "bg-white/5 text-slate-300 border-white/10";
}

export default function CallbackListPanel() {
  const dispatch = useDispatch();
  const isCallBusy = useSelector(selectIsCallBusy);

  const { data, isLoading, isError } = useGetAgentWiseLeadQuery(
    { callbackOnly: true },
    { pollingInterval: 5000, skipPollingIfUnfocused: true }
  );

  const [dialNext, { isLoading: isDialing }] = useDialNextMutation();

  const leads = data?.data ?? [];

  const handleDial = useCallback(
    async (lead) => {
      try {
        if (!lead?.phone_number) {
          alert("Number not available for this callback.");
          return;
        }

        dispatch(setCallState(CALL_STATE.DIALING));

        const res = await dialNext({ phone: lead?.phone_number }).unwrap();

        if (res?.vicidial_response?.toLowerCase?.().includes("error")) {
          alert(res.vicidial_response);
          dispatch(setCallState(CALL_STATE.IDLE));
          return;
        }

        dispatch(setCurrentLead(lead ?? null));
        dispatch(setCallState(CALL_STATE.INCALL));
        dispatch(setIsCallbackDial(true))
      } catch (e) {
        dispatch(setCallState(CALL_STATE.IDLE));
        alert("Failed to dial. Please try again.");
      }
    },
    [dialNext, dispatch]
  );

  const disabledAll = isDialing || isCallBusy;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/70 to-slate-950/80 shadow-[0_30px_120px_rgba(0,0,0,0.55)] p-3">
        <SkeletonAvatarRow count={6} />
      </div>
    );
  }

  if (isError) {
    return <div className="p-3 text-sm text-red-400 animate-fade-in">Failed to load callbacks</div>;
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10
                 bg-gradient-to-b from-slate-900/70 to-slate-950/80
                 shadow-[0_30px_120px_rgba(0,0,0,0.55)]
                 max-h-[500px] overflow-y-auto transition-smooth"
    >
      {/* soft glow */}
      <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(700px_circle_at_15%_0%,rgba(56,189,248,0.16),transparent_55%),radial-gradient(700px_circle_at_90%_10%,rgba(168,85,247,0.14),transparent_55%)]" />

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/40 backdrop-blur px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Callbacks</div>
          <div className="text-xs text-slate-400">{safeText(data?.total_records)} total</div>
        </div>
      </div>

      <div className="relative stagger-children">
        {leads.length === 0 ? (
          <div className="p-4 text-sm text-slate-400 animate-fade-in">No callbacks right now.</div>
        ) : (
          leads.map((lead) => {
            const fullName = [
              safeText(lead?.title) !== "—" ? safeText(lead?.title) : null,
              safeText(lead?.first_name) !== "—" ? safeText(lead?.first_name) : null,
              safeText(lead?.last_name) !== "—" ? safeText(lead?.last_name) : null,
            ]
              .filter(Boolean)
              .join(" ");

            // used ONLY for dialing; not displayed
            const selectedNumber = lead?.phone_number;
            const hasNumber = safeText(selectedNumber) !== "—";

            return (
              <div
                key={lead?.lead_id ?? `${safeText(lead?.first_name)}-${safeText(selectedNumber)}`}
                className="flex items-start gap-3 px-3 py-2 hover:bg-white/10 transition-smooth"
              >
                {/* Avatar */}
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-semibold text-white">
                  {initials(lead?.first_name, lead?.last_name)}
                </div>

                {/* Main (more details, no phone displayed) */}
                <div className="min-w-0 flex-1">
                  {/* Row 1: Name + status */}
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 truncate text-sm font-medium text-white">
                      {fullName || "Unknown Lead"}
                    </div>

                    {safeText(lead?.status) !== "—" && (
                      <span
                        className={[
                          "shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                          badgeClass(lead?.status),
                        ].join(" ")}
                      >
                        {safeText(lead?.status)}
                      </span>
                    )}
                  </div>

                  {/* Row 2: Callback time */}
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-300">
                    <span className="text-slate-500">Callback:</span>
                    <span className="font-medium text-slate-200">
                      {formatDateTime(lead?.callback_time)}
                    </span>
                  </div>

                  {/* Row 3: city/country/id/dob */}
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                    <span className="truncate">{safeText(lead?.city)}</span>
                    <span className="text-slate-600">•</span>
                    <span>{safeText(lead?.country_code)}</span>
                    <span className="text-slate-600">•</span>
                    <span>ID: {safeText(lead?.lead_id)}</span>

                    {safeText(lead?.date_of_birth) !== "—" && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span>DOB: {formatDate(lead?.date_of_birth)}</span>
                      </>
                    )}
                  </div>

                  {/* Row 4: comments (only if present) */}
                  {safeText(lead?.comments) !== "—" && (
                    <div className="mt-1 line-clamp-1 text-xs text-slate-400">
                      <span className="text-slate-500">Note:</span> {safeText(lead?.comments)}
                    </div>
                  )}
                </div>

                {/* Right meta + Call button */}
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <div className="text-right text-xs text-slate-400">
                    <div className="text-slate-500">Added</div>
                    <div>{formatDate(lead?.entry_date)}</div>
                    <div className="text-slate-500">List {safeText(lead?.list_id)}</div>
                  </div>

                  <button
                    type="button"
                    disabled={disabledAll || !hasNumber}
                    onClick={() => handleDial(lead)}
                    className={[
                        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold",
                        "border transition-smooth active:scale-95",
                        disabledAll || !hasNumber
                          ? "border-white/10 bg-white/5 text-slate-500 cursor-not-allowed"
                          : "border-emerald-600/40 bg-emerald-600/20 text-emerald-200 hover:bg-emerald-600/30 hover:text-emerald-100 active:bg-emerald-600/40",
                      ].join(" ")}
                    title={
                      !hasNumber
                        ? "No number available"
                        : disabledAll
                        ? "Dialing or call busy"
                        : "Call this callback"
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
            );
          })
        )}
      </div>
    </div>
  );
}
