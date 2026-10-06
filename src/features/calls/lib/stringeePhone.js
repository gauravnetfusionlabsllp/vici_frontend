/**
 * The dashboard as a Stringee softphone (STRINGEE_DIAL_MODE=browser).
 *
 * One StringeeClient per tab, logged in as the agent's own linked StringeeX
 * user, so a call placed here goes out exactly as it would from their
 * StringeeX softphone: our DID -> the customer, audio in this tab.
 *
 * SDK facts below were read from the SDK source (2026-10-01), not guessed:
 *   signalingstate code  1 Calling, 2 Ringing, 3 Answered, 5 Busy, 6 Ended,
 *                        -1 WebRTC error (e.g. microphone blocked)
 *   makeCall(cb)         cb({ r, callId, message }) - r === 0 is success
 *   addremotestream      the customer's audio as a MediaStream
 */

const SDK_URL = "https://cdn.stringee.com/sdk/web/latest/stringee-web-sdk.min.js";
const AUTH_TIMEOUT_MS = 15000;
// makeCall on a client whose connection silently dropped never calls back.
// Without a limit the dial hung forever with activeCall set: no events, no
// disposition, and the locked lead stayed INCALL.
const MAKECALL_TIMEOUT_MS = 15000;

export const SDK_STATE = { CALLING: 1, RINGING: 2, ANSWERED: 3, BUSY: 5, ENDED: 6, ERROR: -1 };
const TERMINAL = new Set([SDK_STATE.BUSY, SDK_STATE.ENDED, SDK_STATE.ERROR]);
export const isTerminalState = (code) => TERMINAL.has(code);

let sdkPromise = null;
let client = null;
let authPromise = null;
let activeCall = null;
let audioEl = null;
// True between a successful authen and the next disconnect. authPromise stays
// resolved after a drop, so it cannot answer "are we still logged in?".
let connected = false;

function loadSdk() {
  if (window.StringeeClient) return Promise.resolve();
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SDK_URL;
      s.async = true;
      s.onload = () =>
        window.StringeeClient ? resolve() : reject(new Error("Stringee SDK did not load"));
      s.onerror = () => {
        sdkPromise = null;
        reject(new Error("Could not load the Stringee SDK"));
      };
      document.head.appendChild(s);
    });
  }
  return sdkPromise;
}

function resetClient() {
  try {
    client?.disconnect?.();
  } catch {
    /* already gone */
  }
  client = null;
  authPromise = null;
  connected = false;
}

function remoteAudio() {
  if (!audioEl) {
    audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    audioEl.style.display = "none";
    document.body.appendChild(audioEl);
  }
  return audioEl;
}

function cleanup(call) {
  if (activeCall === call) activeCall = null;
  if (audioEl) audioEl.srcObject = null;
}

/**
 * Log in (once per tab). `getToken` returns { token } from
 * GET /stringee/client_token and is reused when the SDK asks for a new one.
 */
export async function connect(getToken) {
  await loadSdk();
  if (client && authPromise && connected) return authPromise;
  // A client that lost its connection is thrown away and logged in again;
  // reusing it is what left dials hanging with no events.
  if (client && authPromise && !connected) resetClient();
  if (client && authPromise) return authPromise;

  client = new window.StringeeClient();
  const thisClient = client;

  authPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Stringee login timed out"));
      if (client === thisClient) resetClient();
    }, AUTH_TIMEOUT_MS);

    thisClient.on("authen", (res) => {
      clearTimeout(timer);
      if (res?.r === 0) {
        if (client === thisClient) connected = true;
        resolve(res.userId);
      } else {
        reject(new Error(res?.message || `Stringee login failed (r=${res?.r})`));
        if (client === thisClient) resetClient();
      }
    });
  });

  // The SDK re-authenticates by itself after a reconnect ("authen" fires again
  // and sets connected back to true). Until then the next dial logs in afresh.
  thisClient.on("disconnect", () => {
    if (client === thisClient) connected = false;
  });

  thisClient.on("requestnewtoken", async () => {
    try {
      const { token } = await getToken();
      thisClient.connect(token);
    } catch (e) {
      console.error("[stringee] token refresh failed", e);
    }
  });

  try {
    const { token } = await getToken();
    thisClient.connect(token);
  } catch (e) {
    resetClient();
    throw e;
  }
  return authPromise;
}

/**
 * Dial `to` from our DID `from`. Resolves with Stringee's callId once the
 * call is accepted; every signalingstate is passed to onState(state, call).
 */
export function dial({ from, to, custom, onState }) {
  if (!client) return Promise.reject(new Error("Stringee is not connected"));
  if (activeCall) {
    // A leftover from a call that already ended (or never got going) must not
    // block the next one - drop it. Only a call that is really ringing or
    // talking still refuses a second dial.
    if (!isStale(activeCall)) {
      return Promise.reject(new Error("A Stringee call is already in progress"));
    }
    dropCall(activeCall);
  }

  return new Promise((resolve, reject) => {
    const call = new window.StringeeCall(client, from, to, false);
    if (custom) call.custom = custom;
    call._startedAt = Date.now();
    call._lastCode = null;
    activeCall = call;

    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      dropCall(call);
      resetClient();
      reject(new Error("Could not reach Stringee - please dial again"));
    }, MAKECALL_TIMEOUT_MS);

    call.on("addremotestream", (stream) => {
      const a = remoteAudio();
      a.srcObject = null;
      a.srcObject = stream;
      a.play?.().catch(() => {});
    });

    call.on("signalingstate", (state) => {
      call._lastCode = state?.code ?? null;
      onState?.(state, call);
      if (isTerminalState(state?.code)) cleanup(call);
    });

    call.makeCall((res) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (res?.r === 0) {
        resolve(res.callId || call.callId || null);
      } else {
        cleanup(call);
        reject(new Error(res?.message || `Stringee call failed (r=${res?.r})`));
      }
    });
  });
}

// Ended, or never past "Calling" within the makeCall limit.
function isStale(call) {
  if (isTerminalState(call._lastCode)) return true;
  const live = call._lastCode === SDK_STATE.RINGING || call._lastCode === SDK_STATE.ANSWERED;
  return !live && Date.now() - (call._startedAt || 0) > MAKECALL_TIMEOUT_MS;
}

// Best-effort hangup that never waits - used to clear a dead call.
function dropCall(call) {
  try {
    call.hangup?.(() => {});
  } catch {
    /* already gone */
  }
  cleanup(call);
}

/** Hang up the call this tab placed. Resolves false when there was none. */
export function hangup() {
  const call = activeCall;
  if (!call) return Promise.resolve(false);
  return new Promise((resolve) => {
    const done = () => {
      cleanup(call);
      resolve(true);
    };
    const fallback = setTimeout(done, 3000);
    try {
      call.hangup(() => {
        clearTimeout(fallback);
        done();
      });
    } catch {
      clearTimeout(fallback);
      done();
    }
  });
}

export const hasActiveCall = () => !!activeCall;
