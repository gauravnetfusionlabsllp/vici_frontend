import { useEffect, useMemo, useRef, useState } from 'react';
import { X, QrCode, Smartphone, KeyRound, RefreshCw, Loader2, CheckCircle2, Play } from 'lucide-react';
import { useGetWaSessionsQuery, useWaProxyMutation } from '@/services';
import { useToast } from '@/shared/hooks/useToast';

const API_BASE = import.meta.env.VITE_BASE_URL;
const CONNECTED = ['WORKING', 'CONNECTED', 'AUTHENTICATED', 'READY'];

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
    } catch { /* not json */ }
    throw new Error(msg);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const j = await res.json();
    const v = j.qr || j.value || j.data || j.base64 || j.image || j.qrCode;
    if (!v) throw new Error('No QR (session may already be connected).');
    return String(v).startsWith('data:') ? String(v) : `data:image/png;base64,${v}`;
  }
  return URL.createObjectURL(await res.blob());
}

// Modal that connects a single session via QR or phone-number pairing.
export default function ConnectModal({ sessionId, onClose }) {
  const { data: sessions = [], refetch } = useGetWaSessionsQuery(undefined, { pollingInterval: 4000 });
  const [waProxy] = useWaProxyMutation();
  const { error: toastError, success } = useToast();

  const [method, setMethod] = useState('qr');
  const [qr, setQr] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrError, setQrError] = useState(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [pairingCode, setPairingCode] = useState(null);
  const [requesting, setRequesting] = useState(false);

  const current = useMemo(
    () => sessions.find((s) => (s?.id || s?.name || s?.sessionId) === sessionId),
    [sessions, sessionId],
  );
  const status = String(current?.status || current?.state || '').toUpperCase();
  const connected = CONNECTED.includes(status);
  // States that have no QR until the session engine is started.
  const NEEDS_START = ['CREATED', 'STOPPED', 'FAILED', 'DISCONNECTED', ''];
  // While the engine boots there's briefly no QR yet — show "preparing" not an error.
  const preparingState = ['CREATED', 'INITIALIZING', 'STARTING', ''].includes(status);

  const loadQr = async () => {
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

  // Auto-start a not-yet-started session once, so a QR can be generated.
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (connected) return;
    if (!autoStartedRef.current && NEEDS_START.includes(status)) {
      autoStartedRef.current = true;
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, connected]);

  // Poll the QR fairly quickly while disconnected (it appears a few seconds
  // after start, and rotates roughly every 20s).
  useEffect(() => {
    if (connected || method !== 'qr') { setQr(null); return; }
    loadQr();
    const t = setInterval(loadQr, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, connected, method]);

  const start = async () => {
    try {
      await waProxy({ method: 'POST', path: `sessions/${sessionId}/start` }).unwrap();
      success('Start requested');
      refetch();
      setTimeout(loadQr, 1500);
    } catch (e) {
      toastError(e?.data?.detail?.wa_error?.message || 'Failed to start session');
    }
  };

  const requestPairing = async () => {
    const phone = phoneInput.replace(/\D/g, '');
    if (!phone) return toastError('Enter the phone number (with country code)');
    setRequesting(true);
    setPairingCode(null);
    try {
      const res = await waProxy({
        method: 'POST',
        path: `sessions/${sessionId}/pairing-code`,
        body: { phoneNumber: phone },
      }).unwrap();
      setPairingCode(res?.code || res?.pairingCode || res?.value || res?.data || JSON.stringify(res));
    } catch (e) {
      toastError(e?.data?.detail?.wa_error?.message || 'Failed to get pairing code');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-pop-in">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Connect session</h3>
            <p className="truncate font-mono text-[11px] text-muted-foreground">{sessionId}</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-smooth">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {connected ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <p className="text-sm font-semibold text-foreground">Connected</p>
              {(current?.phone || current?.pushName) && (
                <p className="text-xs text-muted-foreground">
                  {current?.pushName} <span className="font-mono">{current?.phone}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
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
                  <div className="grid h-60 w-60 place-items-center rounded-xl border border-border bg-white/95 p-3">
                    {qr ? (
                      <img src={qr} alt="WhatsApp QR" className="h-full w-full object-contain" />
                    ) : loadingQr || preparingState ? (
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <Loader2 className="h-7 w-7 animate-spin" />
                        <span className="text-xs">Preparing QR…</span>
                      </div>
                    ) : (
                      <div className="px-4 text-center text-xs text-slate-500">{qrError || 'No QR — click Start session.'}</div>
                    )}
                  </div>
                  <p className="text-center text-[11px] text-muted-foreground">
                    WhatsApp → Linked devices → Link a device → scan. Auto-refreshes every 20s.
                  </p>
                  <button onClick={loadQr} disabled={loadingQr} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-smooth disabled:opacity-50">
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingQr ? 'animate-spin' : ''}`} /> Refresh QR
                  </button>
                </>
              ) : (
                <div className="flex w-full flex-col items-center gap-3">
                  <div className="flex w-full gap-2">
                    <input
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      inputMode="tel"
                      placeholder="918452015261"
                      className="flex-1 rounded-md border border-input bg-input/40 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
                    />
                    <button onClick={requestPairing} disabled={requesting || !phoneInput.trim()} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-smooth disabled:opacity-50">
                      {requesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />} Get code
                    </button>
                  </div>
                  {pairingCode && (
                    <div className="w-full rounded-xl border border-primary/30 bg-primary/10 p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pairing code</p>
                      <p className="mt-1 font-mono text-xl font-bold tracking-[0.2em] text-foreground">{pairingCode}</p>
                    </div>
                  )}
                  <p className="text-center text-[11px] text-muted-foreground">
                    WhatsApp → Linked devices → Link a device → “Link with phone number instead” → enter the code.
                  </p>
                </div>
              )}

              <button onClick={start} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-3 py-1.5 text-xs text-emerald-400 hover:bg-background transition-smooth">
                <Play className="h-3.5 w-3.5" /> Start session
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
