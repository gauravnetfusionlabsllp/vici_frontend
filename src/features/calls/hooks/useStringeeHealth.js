import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectStringeeHealth, setStringeeHealth } from "@/features/calls/slices/callSlice";
import { useStringeeClientTokenMutation } from "@/services";
import * as stringeePhone from "@/features/calls/lib/stringeePhone";

// How often an idle tab tries to get back to Stringee while it is down.
const RECONNECT_MS = 15000;

/**
 * Mirrors lib/stringeePhone's health into Redux (for StringeeStatusBanner),
 * and while Stringee is down with no call parked, keeps trying to log back in
 * so the banner clears by itself the moment the service returns.
 *
 * Health only leaves "unknown" once this tab has tried to reach Stringee, so
 * agents who never dial through Stringee never see the banner or the retries.
 * A parked call runs its own retries (useStringeeBrowserCall); this loop stays
 * out of the way then, because two logins at once would cancel each other.
 *
 * Must be mounted EXACTLY ONCE (TopBar).
 */
export function useStringeeHealth() {
  const dispatch = useDispatch();
  const { status, waiting } = useSelector(selectStringeeHealth);
  const [getToken] = useStringeeClientTokenMutation();

  useEffect(() => {
    dispatch(setStringeeHealth(stringeePhone.getHealth()));
    return stringeePhone.onHealthChange((h) => dispatch(setStringeeHealth(h)));
  }, [dispatch]);

  useEffect(() => {
    if (status !== "down" || waiting) return undefined;
    let inFlight = false;
    const timer = setInterval(() => {
      // Never mid-call (a fresh login would drop the live client) and never
      // over a login that is still pending (it would be reset half-way).
      if (inFlight || stringeePhone.hasActiveCall()) return;
      inFlight = true;
      stringeePhone
        .connect(() => getToken().unwrap())
        .catch(() => {
          /* still down - the health listener already says so */
        })
        .finally(() => {
          inFlight = false;
        });
    }, RECONNECT_MS);
    return () => clearInterval(timer);
  }, [status, waiting, getToken]);
}
