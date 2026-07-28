import { useMemo, useState } from 'react';
import {
  MessageCircle, Plus, Search, RefreshCw, Loader2, QrCode,
  Play, Square, Trash2, X,
} from 'lucide-react';
import { useGetWaSessionsQuery, useWaProxyMutation } from '@/services';
import { useToast } from '@/shared/hooks/useToast';
import ConnectModal from './components/ConnectModal';

const CONNECTED = ['WORKING', 'CONNECTED', 'AUTHENTICATED', 'READY'];

function StatusPill({ status }) {
  const s = String(status || '').toUpperCase();
  const ok = CONNECTED.includes(s);
  const warn = ['QR_READY', 'STARTING', 'SCAN_QR_CODE', 'PAIRING', 'CONNECTING'].includes(s);
  const cls = ok
    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : warn
    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    : 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{status || 'unknown'}</span>;
}

export default function WhatsAppSessionsPage() {
  const { data: sessions = [], isFetching, refetch, error } = useGetWaSessionsQuery(undefined, { pollingInterval: 5000 });
  const [waProxy, { isLoading: acting }] = useWaProxyMutation();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [connectId, setConnectId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((s) => {
      const id = (s?.id || s?.name || s?.sessionId || '').toLowerCase();
      const st = String(s?.status || s?.state || '').toUpperCase();
      const matchesQ = !q || id.includes(q) || String(s?.phone || '').includes(q);
      const matchesS =
        statusFilter === 'all' ||
        (statusFilter === 'connected' && CONNECTED.includes(st)) ||
        (statusFilter === 'disconnected' && !CONNECTED.includes(st));
      return matchesQ && matchesS;
    });
  }, [sessions, search, statusFilter]);

  const doAction = async (id, action) => {
    try {
      await waProxy({ method: 'POST', path: `sessions/${id}/${action}` }).unwrap();
      success(`${action} requested`);
      refetch();
    } catch (e) {
      toastError(e?.data?.detail?.wa_error?.message || `Failed to ${action}`);
    }
  };

  const deleteSession = async (id) => {
    if (!window.confirm(`Delete session "${id}"? This logs it out.`)) return;
    try {
      await waProxy({ method: 'DELETE', path: `sessions/${id}` }).unwrap();
      success('Session deleted');
      refetch();
    } catch (e) {
      toastError(e?.data?.detail?.wa_error?.message || 'Failed to delete');
    }
  };

  const createSession = async () => {
    const name = newName.trim();
    if (!name) return toastError('Enter a session name');
    try {
      await waProxy({ method: 'POST', path: 'sessions', body: { name } }).unwrap();
      success('Session created');
      setShowNew(false);
      setNewName('');
      refetch();
    } catch (e) {
      toastError(e?.data?.detail?.wa_error?.message || 'Failed to create session');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">WhatsApp Sessions</h1>
            <p className="text-xs text-muted-foreground">Manage sessions and QR / phone connections.</p>
          </div>
        </div>
        <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-smooth">
          <Plus className="h-4 w-4" /> New Session
        </button>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sessions…"
            className="w-full rounded-md border border-input bg-input/40 py-2 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-border bg-input px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">All status</option>
          <option value="connected">Connected</option>
          <option value="disconnected">Disconnected</option>
        </select>
        <button onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-3 py-2 text-xs text-foreground hover:bg-background transition-smooth disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error?.status === 502 || error?.data?.status === 502
            ? 'WhatsApp server unreachable (HTTP 502). Make sure open-wa is running.'
            : (error?.data?.detail?.wa_error?.message || 'Failed to load sessions.')}
        </p>
      )}

      {/* List */}
      {isFetching && sessions.length === 0 ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading sessions…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card/40 py-16 text-muted-foreground">
          <QrCode className="h-8 w-8" />
          <p className="text-sm font-medium text-foreground">No sessions found</p>
          <p className="text-xs">Create a new session to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s, i) => {
            const id = s?.id || s?.name || s?.sessionId || `session-${i}`;
            const st = String(s?.status || s?.state || '').toUpperCase();
            const connected = CONNECTED.includes(st);
            return (
              <div key={id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card/60 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{s?.name || id}</span>
                    <StatusPill status={s?.status || s?.state} />
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                    {id}{s?.phone ? ` · ${s.phone}` : ''}{s?.pushName ? ` · ${s.pushName}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {!connected && (
                    <button onClick={() => setConnectId(id)} className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-[11px] text-primary hover:bg-primary/20 transition-smooth">
                      <QrCode className="h-3 w-3" /> Connect
                    </button>
                  )}
                  <button onClick={() => doAction(id, 'start')} disabled={acting} title="Start" className="inline-flex items-center gap-1 rounded-md border border-border bg-background/50 px-2 py-1 text-[11px] text-emerald-400 hover:bg-background transition-smooth disabled:opacity-50">
                    <Play className="h-3 w-3" />
                  </button>
                  <button onClick={() => doAction(id, 'stop')} disabled={acting} title="Stop" className="inline-flex items-center gap-1 rounded-md border border-border bg-background/50 px-2 py-1 text-[11px] text-amber-400 hover:bg-background transition-smooth disabled:opacity-50">
                    <Square className="h-3 w-3" />
                  </button>
                  <button onClick={() => deleteSession(id)} disabled={acting} title="Delete" className="inline-flex items-center gap-1 rounded-md border border-border bg-background/50 px-2 py-1 text-[11px] text-red-400 hover:bg-background transition-smooth disabled:opacity-50">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Connect modal */}
      {connectId && <ConnectModal sessionId={connectId} onClose={() => setConnectId(null)} />}

      {/* New session modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl animate-pop-in">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">New session</h3>
              <button onClick={() => setShowNew(false)} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-smooth">
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Session name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') createSession(); }}
              placeholder="e.g. sales-bot"
              className="w-full rounded-md border border-input bg-input/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
            />
            <button onClick={createSession} disabled={acting || !newName.trim()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-smooth disabled:opacity-50">
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
