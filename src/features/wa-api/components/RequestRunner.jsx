import { useMemo, useState } from 'react';
import { Play, Loader2, Paperclip } from 'lucide-react';
import { METHODS, pathParams } from '../catalog';
import { cn } from '@/shared/lib/utils';
import { useToast } from '@/shared/hooks/useToast';

const inputCls =
  'w-full rounded-md border border-input bg-input/40 px-3 py-2 text-xs text-foreground ' +
  'placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-smooth';

// Read a browser File into base64 (without the data: URL prefix).
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Builds a request from a chosen operation and runs it via the proxy.
// Remounted (keyed) whenever a new operation is picked, so state resets cleanly.
export default function RequestRunner({ op, sessionId, onRun }) {
  const [method, setMethod] = useState(op?.m || 'GET');
  const [path, setPath] = useState(op?.p || '');
  const [bodyText, setBodyText] = useState(op?.b ? JSON.stringify(op.b, null, 2) : '');
  const [paramValues, setParamValues] = useState({});
  const [resp, setResp] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const { error: toastError } = useToast();

  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);

  // Non-session path params still needing a value (sessionId comes from the picker).
  const extraParams = useMemo(
    () => pathParams(path).filter((p) => p !== 'sessionId'),
    [path],
  );

  const effectivePath = useMemo(() => {
    let out = path.replace('{sessionId}', sessionId || '{sessionId}');
    for (const p of extraParams) {
      const v = paramValues[p];
      if (v) out = out.replace(`{${p}}`, encodeURIComponent(v));
    }
    return out;
  }, [path, sessionId, extraParams, paramValues]);

  const unresolved = effectivePath.includes('{');

  const [attaching, setAttaching] = useState(false);
  const [attachedName, setAttachedName] = useState('');

  // Attach any local file: base64-encode it and merge into the JSON body's
  // `file` object (data/mimetype/filename). Works for send-image/video/audio/document.
  const onAttach = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAttaching(true);
    try {
      const data = await fileToBase64(file);
      let obj = {};
      if (bodyText.trim()) {
        try {
          obj = JSON.parse(bodyText);
        } catch {
          return toastError('Fix the JSON body before attaching a file');
        }
      }
      obj.file = { data, mimetype: file.type || undefined, filename: file.name };
      setBodyText(JSON.stringify(obj, null, 2));
      setAttachedName(file.name);
    } finally {
      setAttaching(false);
    }
  };

  const run = async () => {
    if (unresolved) return toastError('Fill in the path parameters first');
    let body;
    if (hasBody && bodyText.trim()) {
      try {
        body = JSON.parse(bodyText);
      } catch {
        return toastError('Request body is not valid JSON');
      }
    }
    setBusy(true);
    try {
      const r = await onRun({ method, path: effectivePath, body });
      setStatus(r.status);
      setResp(r.data);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Builder */}
      <div className="shrink-0 rounded-xl border border-border bg-card/60 p-4">
        {op?.s && <p className="mb-2 text-xs text-muted-foreground">{op.s}</p>}
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="rounded-md border border-border bg-input px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className={cn(inputCls, 'flex-1 font-mono')}
            placeholder="sessions/{sessionId}/chats"
          />
        </div>

        <p className="mt-2 break-all font-mono text-[11px] text-muted-foreground">
          → <span className={unresolved ? 'text-amber-400' : 'text-emerald-400'}>/wa-proxy/{effectivePath}</span>
        </p>

        {extraParams.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {extraParams.map((p) => (
              <div key={p}>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">{p}</label>
                <input
                  className={inputCls}
                  placeholder={p}
                  value={paramValues[p] || ''}
                  onChange={(e) => setParamValues((s) => ({ ...s, [p]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        )}

        {hasBody && (
          <>
            <div className="mb-1 mt-3 flex items-center justify-between">
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                JSON body
              </label>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background/50 px-2 py-1 text-[11px] text-primary hover:bg-background transition-smooth">
                {attaching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />}
                Attach file
                <input type="file" className="hidden" onChange={onAttach} />
              </label>
            </div>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className={cn(inputCls, 'min-h-[140px] resize-y font-mono')}
              placeholder="{ }"
            />
            {attachedName && (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Attached <span className="text-foreground">{attachedName}</span> as base64 into <span className="font-mono">file.data</span>.
                Use with <span className="font-mono">send-image/video/audio/document</span>.
              </p>
            )}
          </>
        )}

        <button
          onClick={run}
          disabled={busy || !path.trim()}
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-smooth disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Send request
        </button>
      </div>

      {/* Response */}
      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-card/60 p-4">
        <div className="mb-2 flex shrink-0 items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Response</h3>
          {status != null && (
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-[11px] font-medium',
                String(status).startsWith('2') || status === 'OK'
                  ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                  : 'border-red-500/30 bg-red-500/15 text-red-400',
              )}
            >
              {status}
            </span>
          )}
        </div>
        {resp != null ? (
          <pre className="min-h-0 flex-1 overflow-auto rounded-lg bg-background/60 p-3 font-mono text-xs text-foreground">
            {typeof resp === 'string' ? resp : JSON.stringify(resp, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">Pick an endpoint on the left, then Send.</p>
        )}
      </div>
    </div>
  );
}
