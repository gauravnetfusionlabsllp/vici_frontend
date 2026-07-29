import { ChevronRight, Loader2 } from "lucide-react";

const SURFACE = `rounded-xl border border-cyan-400/20
  bg-gradient-to-r from-cyan-900/50 via-sky-900/40 to-indigo-900/40`;

/**
 * Agent "Dial Next" control. Purely presentational — the countdown and the
 * dial action come from `useAutoDial`, which is mounted once in TopBar.
 */
export default function DialNextButton({
  variant = "desktop",
  onDial,
  nextDialIn,
  isDialing,
  isPaused,
  isAvailableLeads,
  disabled,
}) {
  if (variant === "mobile") {
    return (
      <button
        onClick={onDial}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-3 ${SURFACE}
                    disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className="tracking-widest text-xs font-semibold text-cyan-100 font-mono-nums">
          {isDialing ? "DIALING..." : !isAvailableLeads ? "NO LEADS" : `DIAL NEXT in ${nextDialIn}`}
        </span>
        {isDialing ? (
          <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
        ) : (
          <ChevronRight className="w-5 h-5 text-cyan-200" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onDial}
      disabled={disabled}
      className={`group hidden md:flex items-center gap-3 px-4 py-2 ${SURFACE}
                  hover:from-cyan-900/70 hover:via-sky-900/60 hover:to-indigo-900/60
                  shadow-[0_0_30px_rgba(34,211,238,0.15)]
                  transition-all duration-200 active:scale-[0.98]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60
                  disabled:opacity-50 disabled:cursor-not-allowed
                  disabled:hover:from-cyan-900/50 disabled:hover:via-sky-900/40 disabled:hover:to-indigo-900/40`}
      title="Dial Next"
      aria-label={
        !isAvailableLeads ? "No leads available" : `Dial next lead in ${nextDialIn} seconds`
      }
    >
      <div className="flex items-center gap-2">
        {isDialing ? (
          <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
        ) : (
          <ChevronRight className="w-5 h-5 text-cyan-200 transition-transform group-hover:translate-x-0.5" />
        )}
        <span className="tracking-widest text-xs font-semibold text-cyan-100 font-mono-nums">
          {!isAvailableLeads ? "No Leads" : `DIAL NEXT in ${nextDialIn}`}
        </span>
      </div>

      <div className="flex items-end gap-1 h-4">
        {[6, 10, 7, 14, 9, 12].map((h, i) => (
          <span
            key={i}
            className={`w-1 rounded-sm bg-cyan-300/70 origin-bottom ${
              isDialing || (isAvailableLeads && !isPaused) ? "animate-wave" : ""
            }`}
            style={{ height: h, animationDelay: `${i * 110}ms` }}
          />
        ))}
      </div>
    </button>
  );
}
