import { useEffect, useMemo, useState } from 'react';
import { QrCode, RefreshCw, Loader2, CheckCircle2, Play, Power, Smartphone, KeyRound } from 'lucide-react';
import { useGetWaSessionsQuery, useWaProxyMutation } from '@/services';
import { useToast } from '@/shared/hooks/useToast';

const API_BASE = import.meta.env.VITE_BASE_URL;

// The QR endpoint may return an image or JSON — and it needs the Bearer token,
// so we fetch it manually (an <img src> can't send auth headers) and normalize
// to a displayable data/object URL.
function authToken() {
  try {
    return JSON.parse(localStorage.getItem('user'))?.access_token || '';
  } catch {
    return '';
  }
}

async function fetchQr(sessionId) {
  const res = await fetch(
    `${API_BASE}/wa-proxy/sessions/${encodeURIComponent(sessionId)}/qr`,
    { headers: { Authorization: `Bearer ${authToken()}` } },
  );
  if (!res.ok) {
    let msg = `QR unavailable (${res.status})`;
    try {
      const j = await res.json();
      msg = j?.detail?.wa_error?.message || (typeof j?.detail === 'string' ? j.detail : msg);
    } catch {
      /* not JSON */
    }
    throw new Error(msg);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const j = await res.json();
    const v = j.qr || j.value || j.data || j.base64 || j.image || j.qrCode;
    if (!v) throw new Error('No QR code in response (session may already be connected).');
    return String(v).startsWith('data:') ? String(v) : `data:image/png;base64,${v}`;
  }
  return URL.createObjectURL(await res.blob());
}

const CONNECTED = ['WORKING', 'CONNECTED', 'AUTHENTICATED', 'READY'];

export default function WhatsAppLoginPage() {
  // Poll sessions so the page flips to "connected" automatically after scanning.
  const { data: sessions = [], refetch } = useGetWaSessionsQuery(undefined, { pollingInterval: 4000 });
  const [waProxy] = useWaProxyMutation();
  const { error: toastError, success } = useToast();

  const [sessionId, setSessionId] = useState('');
  const [qr, setQr] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrError, setQrError] = useState(null);

  // Login method + phone-pairing state.
  const [method, setMethod] = useState('qr'); // 'qr' | 'phone'
  const [phoneInput, setPhoneInput] = useState('');
  const [pairingCode, setPairingCode] = useState(null);
  const [requestingCode, setRequestingCode] = useState(false);

  const ids = useMemo(
    () => sessions.map((s) => s?.id || s?.name || s?.sessionId).filter(Boolean),
    [sessions],
  );
  useEffect(() => {
    if (!sessionId && ids.length) setSessionId(ids[0]);
  }, [ids, sessionId]);

  const current = useMemo(
    () => sessions.find((s) => (s?.id || s?.name || s?.sessionId) === sessionId),
    [sessions, sessionId],
  );
  const status = String(current?.status || current?.state || '').toUpperCase();
  const connected = CONNECTED.includes(status);
  const businessNumber =
    current?.me?.id || current?.me?.pushName || current?.pushName || current?.phone || null;

  const loadQr = async () => {
    if (!sessionId) return;
    setLoadingQr(true);
    setQrError(null);
    try {
      setQr(await fetchQr(sessionId));
    } catch (e) {
      setQr(null);
      setQrError(e.message);
    } finally {
      setLoadingQr(false);
    }
  };

  // Fetch (and periodically refresh) the QR while disconnected. QR codes expire,
  // so re-pull every 20s until the session connects.
  useEffect(() => {
    if (!sessionId || connected) {
      setQr(null);
      return;
    }
    loadQr();
    const t = setInterval(loadQr, 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, connected]);

  // Request a pairing code for "link with phone number". Needs a started session.
  const requestPairing = async () => {
    const phone = phoneInput.replace(/\D/g, '');
    if (!phone) return toastError('Enter the business phone number (with country code)');
    setRequestingCode(true);
    setPairingCode(null);
    try {
      const res = await waProxy({
        method: 'POST',
        path: `sessions/${sessionId}/pairing-code`,
        body: { phoneNumber: phone },
      }).unwrap();
      const code =
        res?.code || res?.pairingCode || res?.value || res?.data ||
        (typeof res === 'string' ? res : null);
      setPairingCode(code || JSON.stringify(res));
    } catch (e) {
      toastError(e?.data?.detail?.wa_error?.message || 'Failed to get pairing code');
    } finally {
      setRequestingCode(false);
    }
  };

  const sessionAction = async (action) => {
    try {
      await waProxy({ method: 'POST', path: `sessions/${sessionId}/${action}` }).unwrap();
      success(`Session ${action} requested`);
      refetch();
      if (action === 'start') setTimeout(loadQr, 1500);
    } catch (e) {
      toastError(e?.data?.detail?.wa_error?.message || `Failed to ${action} session`);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <QrCode className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">WhatsApp Login</h1>
          <p className="text-xs text-muted-foreground">
            Scan the QR with the business phone to connect it to the system.
          </p>
        </div>
      </div>

      {/* Session picker + status */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-muted-foreground">Session</label>
          <select
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="max-w-[240px] rounded-md border border-border bg-input px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {ids.length === 0 && <option value="">(no sessions)</option>}
            {ids.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
            connected
              ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
              : 'border-amber-500/30 bg-amber-500/15 text-amber-400'
          }`}
        >
          {status || 'unknown'}
        </span>
      </div>

      {/* Body */}
      <div className="rounded-xl border border-border bg-card/60 p-6">
        {connected ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            <h2 className="text-base font-semibold text-foreground">Connected</h2>
            {businessNumber && (
              <p className="text-sm text-muted-foreground">
                Business number:{' '}
                <span className="font-mono text-foreground">{String(businessNumber).replace('@c.us', '')}</span>
              </p>
            )}
            <button
              onClick={() => sessionAction('stop')}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-3 py-1.5 text-xs text-red-400 hover:bg-background transition-smooth"
            >
              <Power className="h-3.5 w-3.5" /> Log out / stop session
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {/* Method toggle */}
            <div className="inline-flex rounded-lg border border-border bg-background/40 p-1">
              {[
                { k: 'qr', label: 'QR code', Icon: QrCode },
                { k: 'phone', label: 'Phone number', Icon: Smartphone },
              ].map(({ k, label, Icon }) => (
                <button
                  key={k}
                  onClick={() => setMethod(k)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-smooth ${
                    method === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            {method === 'qr' ? (
              <>
                <div className="grid h-64 w-64 place-items-center rounded-xl border border-border bg-white/95 p-3">
                  {loadingQr ? (
                    <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
                  ) : qr ? (
                    <img src={qr} alt="WhatsApp login QR" className="h-full w-full object-contain" />
                  ) : (
                    <div className="px-4 text-center text-xs text-slate-500">
                      {qrError || 'No QR yet. Start the session, then refresh.'}
                    </div>
                  )}
                </div>
                <ol className="w-full max-w-sm list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
                  <li>Open WhatsApp on the business phone.</li>
                  <li>Tap <span className="text-foreground">Settings → Linked devices → Link a device</span>.</li>
                  <li>Scan this QR. It refreshes automatically every 20s.</li>
                </ol>
                <button
                  onClick={loadQr}
                  disabled={loadingQr || !sessionId}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-smooth disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingQr ? 'animate-spin' : ''}`} /> Refresh QR
                </button>
              </>
            ) : (
              <div className="flex w-full max-w-sm flex-col items-center gap-3">
                <div className="w-full">
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
                    Business phone number (with country code)
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      inputMode="tel"
                      placeholder="918452015261"
                      className="flex-1 rounded-md border border-input bg-input/40 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none transition-smooth"
                    />
                    <button
                      onClick={requestPairing}
                      disabled={requestingCode || !sessionId || !phoneInput.trim()}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-smooth disabled:opacity-50"
                    >
                      {requestingCode ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                      Get code
                    </button>
                  </div>
                </div>

                {pairingCode && (
                  <div className="w-full rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pairing code</p>
                    <p className="mt-1 font-mono text-2xl font-bold tracking-[0.2em] text-foreground">{pairingCode}</p>
                  </div>
                )}

                <ol className="w-full list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
                  <li>On the business phone: <span className="text-foreground">Settings → Linked devices → Link a device</span>.</li>
                  <li>Tap <span className="text-foreground">Link with phone number instead</span>.</li>
                  <li>Enter the code shown above (codes expire — request a new one if it doesn't work).</li>
                </ol>
              </div>
            )}

            {/* Start session — needed for either method before a code/QR is issued */}
            <button
              onClick={() => sessionAction('start')}
              disabled={!sessionId}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-3 py-1.5 text-xs text-emerald-400 hover:bg-background transition-smooth disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" /> Start session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
