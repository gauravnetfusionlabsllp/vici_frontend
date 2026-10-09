import { useSelector } from "react-redux";
import { Loader2, WifiOff } from "lucide-react";

import { selectStringeeHealth } from "@/features/calls/slices/callSlice";
import { STRINGEE } from "@/shared/lib/stringeeBrand";

/**
 * App-wide strip under the top bar while Stringee is unreachable from this
 * tab (lib/stringeePhone health = "down"). Clears itself the moment the
 * connection comes back - useStringeeHealth keeps retrying meanwhile.
 *
 * Renders nothing for anyone who has not dialled through Stringee in this
 * tab, since their health is still "unknown".
 */
export default function StringeeStatusBanner() {
  const { status, reason, waiting } = useSelector(selectStringeeHealth);
  if (status !== "down") return null;

  return (
    <div
      role="alert"
      className="mx-4 mt-3 flex items-start gap-3 rounded-lg border px-4 py-2.5 text-sm text-white shadow-lg"
      style={{ background: `${STRINGEE.red}E6`, borderColor: STRINGEE.red }}
    >
      <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          Stringee is not working. Stringee service is down.
        </p>
        <p className="text-white/90">
          {waiting
            ? "Your call is on hold and will start connecting automatically once it comes back."
            : "Calls to Indian numbers will start connecting once it comes back."}
        </p>
        {reason && <p className="mt-0.5 text-[11px] text-white/70">{reason}</p>}
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-white/85">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Retrying…
      </span>
    </div>
  );
}
