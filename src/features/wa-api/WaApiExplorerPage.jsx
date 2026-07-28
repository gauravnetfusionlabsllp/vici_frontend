import { useEffect, useMemo, useState } from 'react';
import { Terminal, RefreshCw } from 'lucide-react';
import { useWaProxyMutation, useGetWaSessionsQuery } from '@/services';
import OperationList from './components/OperationList';
import RequestRunner from './components/RequestRunner';

// Full open-wa API explorer. Every operation is driven through the backend
// `/wa-proxy/{path}` (JWT-protected; open-wa key injected server-side).
export default function WaApiExplorerPage() {
  const [query, setQuery] = useState('');
  const [op, setOp] = useState(null);
  const [sessionId, setSessionId] = useState('');

  const { data: sessions = [], isFetching, refetch } = useGetWaSessionsQuery();
  const [waProxy] = useWaProxyMutation();

  const sessionIds = useMemo(
    () => sessions.map((s) => s?.id || s?.name || s?.sessionId).filter(Boolean),
    [sessions],
  );

  // Default the session picker to the first available session.
  useEffect(() => {
    if (!sessionId && sessionIds.length) setSessionId(sessionIds[0]);
  }, [sessionIds, sessionId]);

  // Runs a proxied call and normalizes success/error into { status, data }.
  const onRun = async ({ method, path, body }) => {
    try {
      const data = await waProxy({ method, path, body }).unwrap();
      return { status: 'OK', data };
    } catch (e) {
      return { status: e?.status ?? 'ERR', data: e?.data ?? { error: String(e) } };
    }
  };

  const activeKey = op ? `${op.m} ${op.p}` : null;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg border border-primary/30 bg-primary/10">
            <Terminal className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-none text-foreground">open-wa API Explorer</h1>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Call any WhatsApp endpoint through the secure proxy.
            </p>
          </div>
        </div>

        {/* Session picker */}
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-muted-foreground">Session</label>
          <select
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="max-w-[220px] rounded-md border border-border bg-input px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {sessionIds.length === 0 && <option value="">(no sessions)</option>}
            {sessionIds.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-2.5 py-1.5 text-xs text-foreground hover:bg-background transition-smooth disabled:opacity-50"
            title="Reload sessions"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Two-pane explorer */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(280px,340px)_1fr] h-[calc(100vh-11rem)] min-h-[560px]">
        <div className="min-h-0 overflow-hidden rounded-xl border border-border bg-card/60">
          <OperationList query={query} onQuery={setQuery} onPick={setOp} activeKey={activeKey} />
        </div>
        <div className="min-h-0">
          {op ? (
            <RequestRunner key={activeKey} op={op} sessionId={sessionId} onRun={onRun} />
          ) : (
            <div className="grid h-full place-items-center rounded-xl border border-border bg-card/60 text-center text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <Terminal className="h-6 w-6" />
                <p className="text-sm">Select an endpoint from the left to build a request.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
