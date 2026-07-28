import { RefreshCw, Play, Square, Copy, Loader2 } from 'lucide-react';
import {
  useGetWaSessionsQuery,
  useWaProxyMutation,
} from '@/services';
import { useToast } from '@/shared/hooks/useToast';

// open-wa may return an array of sessions, or an object wrapping them.
function normalizeSessions(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.sessions)) return data.sessions;
  return [];
}

function StatusPill({ status }) {
  const s = String(status || '').toUpperCase();
  const ok = ['CONNECTED', 'WORKING', 'READY', 'AUTHENTICATED'].includes(s);
  const warn = ['STARTING', 'SCAN_QR_CODE', 'PAIRING', 'CONNECTING'].includes(s);
  const cls = ok
    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : warn
    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    : 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {status || 'unknown'}
    </span>
  );
}

export default function SessionsPanel() {
  const { data, isFetching, refetch, error } = useGetWaSessionsQuery();
  const [waProxy, { isLoading: acting }] = useWaProxyMutation();
  const { success, error: toastError, info } = useToast();

  const sessions = normalizeSessions(data);

  const doAction = async (id, action) => {
    try {
      await waProxy({ method: 'POST', path: `sessions/${id}/${action}` }).unwrap();
      success(`Session ${action} requested`);
      refetch();
    } catch (e) {
      toastError(e?.data?.detail?.wa_error?.message || `Failed to ${action} session`);
    }
  };

  const copyId = (id) => {
    navigator.clipboard?.writeText(id);
    info('Session id copied');
  };

  return (
    <div className="rounded-xl border border-border bg-card/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Sessions <span className="text-muted-foreground">({sessions.length})</span>
        </h3>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-3 py-1.5 text-xs text-foreground hover:bg-background transition-smooth disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error?.data?.detail?.wa_error?.message ||
            (typeof error?.data?.detail === 'string' ? error.data.detail : 'Failed to load sessions')}
        </p>
      )}

      {isFetching && sessions.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading sessions…
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sessions found.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s, i) => {
            const id = s.id || s.name || s.sessionId || `session-${i}`;
            const status = s.status || s.state || s.connectionState;
            return (
              <div
                key={id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-xs text-foreground">{id}</span>
                    <button
                      onClick={() => copyId(id)}
                      className="text-muted-foreground hover:text-foreground transition-smooth"
                      title="Copy id"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {s.me?.pushName || s.pushName ? (
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {s.me?.pushName || s.pushName}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={status} />
                  <button
                    onClick={() => doAction(id, 'start')}
                    disabled={acting}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background/50 px-2 py-1 text-[11px] text-emerald-400 hover:bg-background transition-smooth disabled:opacity-50"
                  >
                    <Play className="h-3 w-3" /> Start
                  </button>
                  <button
                    onClick={() => doAction(id, 'stop')}
                    disabled={acting}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background/50 px-2 py-1 text-[11px] text-red-400 hover:bg-background transition-smooth disabled:opacity-50"
                  >
                    <Square className="h-3 w-3" /> Stop
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
