import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { useWaProxyMutation } from '@/services';
import { useToast } from '@/shared/hooks/useToast';
import { cn } from '@/shared/lib/utils';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

// A few ready-made calls so it's obvious how to drive open-wa.
const PRESETS = [
  { label: 'List sessions', method: 'GET', path: 'sessions', body: '' },
  {
    label: 'Send text',
    method: 'POST',
    path: 'sessions/{sessionId}/messages/send-text',
    body: '{\n  "chatId": "918452015261@c.us",\n  "text": "Hello"\n}',
  },
  { label: 'Session status', method: 'GET', path: 'sessions/{sessionId}/status', body: '' },
  { label: 'List chats', method: 'GET', path: 'sessions/{sessionId}/chats', body: '' },
  { label: 'List contacts', method: 'GET', path: 'sessions/{sessionId}/contacts', body: '' },
  { label: 'List templates', method: 'GET', path: 'sessions/{sessionId}/templates', body: '' },
];

const inputCls =
  'w-full rounded-md bg-input border border-border px-3 py-2 text-sm text-foreground ' +
  'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-smooth';

export default function ApiConsole() {
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('sessions');
  const [bodyText, setBodyText] = useState('');
  const [resp, setResp] = useState(null);
  const [status, setStatus] = useState(null);

  const { error: toastError } = useToast();
  const [waProxy, { isLoading }] = useWaProxyMutation();

  const applyPreset = (p) => {
    setMethod(p.method);
    setPath(p.path);
    setBodyText(p.body);
    setResp(null);
    setStatus(null);
  };

  const run = async () => {
    let body;
    if (['POST', 'PUT', 'PATCH'].includes(method) && bodyText.trim()) {
      try {
        body = JSON.parse(bodyText);
      } catch {
        return toastError('Body is not valid JSON');
      }
    }
    try {
      const res = await waProxy({ method, path, body }).unwrap();
      setResp(res);
      setStatus('OK');
    } catch (e) {
      setStatus(e?.status ?? 'ERR');
      setResp(e?.data ?? { error: String(e) });
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Request builder */}
      <div className="rounded-xl border border-border bg-card/60 p-5">
        <h3 className="mb-1 text-sm font-semibold text-foreground">API Console</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Calls <span className="font-mono">/wa-proxy/&lt;path&gt;</span> → open-wa{' '}
          <span className="font-mono">/api/&lt;path&gt;</span>. Replace{' '}
          <span className="font-mono">{'{sessionId}'}</span> with a real session id.
        </p>

        <div className="mb-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="rounded-full border border-border bg-background/50 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-background transition-smooth"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="rounded-md bg-input border border-border px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            className={cn(inputCls, 'flex-1 font-mono')}
            placeholder="sessions/<id>/chats"
            value={path}
            onChange={(e) => setPath(e.target.value)}
          />
        </div>

        {['POST', 'PUT', 'PATCH'].includes(method) && (
          <>
            <label className="mb-1 mt-4 block text-xs uppercase tracking-wider text-muted-foreground">
              JSON body
            </label>
            <textarea
              className={cn(inputCls, 'min-h-[160px] resize-y font-mono')}
              placeholder='{ "chatId": "…@c.us", "text": "Hi" }'
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
            />
          </>
        )}

        <button
          onClick={run}
          disabled={isLoading || !path.trim()}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-smooth disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Send request
        </button>
      </div>

      {/* Response */}
      <div className="rounded-xl border border-border bg-card/60 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Response</h3>
          {status != null && (
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-[11px] font-medium',
                status === 'OK'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/15 text-red-400 border-red-500/30',
              )}
            >
              {status}
            </span>
          )}
        </div>
        {resp != null ? (
          <pre className="max-h-[460px] overflow-auto rounded-lg bg-background/60 p-3 text-xs text-foreground font-mono">
            {JSON.stringify(resp, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">Pick a preset or build a request, then Send.</p>
        )}
      </div>
    </div>
  );
}
