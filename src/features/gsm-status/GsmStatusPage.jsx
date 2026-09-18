import { useMemo, useState } from 'react';
import {
  SignalHigh, SignalLow, SignalZero, Smartphone, RefreshCw, Loader2,
  AlertTriangle, CheckCircle2, PhoneCall, XCircle, Server, Wifi, WifiOff,
} from 'lucide-react';

import { useGetGsmStatusQuery } from '@/services';

// SIM state → colour + label. `free` = registered & idle (ready to dial),
// `busy` = in a call / sending SMS, `offline` = every fault state.
const STATE_STYLE = {
  free:    { ring: 'border-emerald-500/40 bg-emerald-500/10', dot: 'bg-emerald-500', text: 'text-emerald-400', label: 'Free' },
  busy:    { ring: 'border-amber-500/40 bg-amber-500/10',     dot: 'bg-amber-500',   text: 'text-amber-400',   label: 'Busy' },
  offline: { ring: 'border-slate-500/30 bg-slate-500/5',      dot: 'bg-slate-500',   text: 'text-slate-400',   label: 'Offline' },
};

const fmtTime = (epoch) =>
  epoch ? new Date(epoch * 1000).toLocaleTimeString() : '—';

function SignalBars({ level }) {
  // Gateway reports 0–4 bars.
  const n = Math.max(0, Math.min(4, Number(level) || 0));
  const Icon = n >= 3 ? SignalHigh : n >= 1 ? SignalLow : SignalZero;
  return <Icon className={`h-3.5 w-3.5 ${n >= 3 ? 'text-emerald-400' : n >= 1 ? 'text-amber-400' : 'text-slate-500'}`} />;
}

function StatTile({ icon: Icon, label, value, tone = 'default' }) {
  const toneCls = {
    default:  'text-foreground',
    emerald:  'text-emerald-400',
    amber:    'text-amber-400',
    slate:    'text-slate-400',
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${toneCls}`}>{value}</div>
    </div>
  );
}

/** One SIM/port cell — colour-coded, with the details on hover. */
function PortCell({ p }) {
  const st = STATE_STYLE[p.state] || STATE_STYLE.offline;
  const title = [
    `Port ${p.port} · ${p.name || 'GSM'}`,
    `Status: ${p.status_label}`,
    p.carrier && `Carrier: ${p.carrier}`,
    p.phone && `Number: ${p.phone}`,
    p.state !== 'offline' && `Signal: ${p.signal}/4`,
    p.imsi && `IMSI: ${p.imsi}`,
  ].filter(Boolean).join('\n');

  return (
    <div
      title={title}
      className={`rounded-lg border ${st.ring} p-2.5 transition-colors`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">#{p.port}</span>
        <span className={`h-2 w-2 rounded-full ${st.dot}`} />
      </div>
      <div className="mt-1 truncate text-[11px] text-muted-foreground" title={p.name}>
        {p.name || 'GSM'}
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className={`text-[11px] font-medium ${st.text}`}>{st.label}</span>
        {p.state !== 'offline' ? <SignalBars level={p.signal} /> : null}
      </div>
      <div className="mt-0.5 truncate text-[10px] text-muted-foreground" title={p.carrier}>
        {p.state === 'offline' ? p.status_label : (p.carrier || '—')}
      </div>
    </div>
  );
}

function GatewayCard({ gw }) {
  const [filter, setFilter] = useState('all');
  const ports = useMemo(() => {
    if (filter === 'all') return gw.ports;
    return gw.ports.filter((p) => p.state === filter);
  }, [gw.ports, filter]);

  const c = gw.counts;
  const chips = [
    { key: 'all',     label: `All ${c.total}` },
    { key: 'free',    label: `Free ${c.free}`,    tone: 'text-emerald-400' },
    { key: 'busy',    label: `Busy ${c.busy}`,    tone: 'text-amber-400' },
    { key: 'offline', label: `Offline ${c.offline}`, tone: 'text-slate-400' },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card">
      {/* Card header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`grid h-9 w-9 place-items-center rounded-lg ${gw.online ? 'bg-emerald-500/15 text-emerald-400' : gw.locked ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>
            <Server className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{gw.label}</h3>
              {gw.online
                ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400"><Wifi className="h-3 w-3" /> Online</span>
                : gw.locked
                ? <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400"><WifiOff className="h-3 w-3" /> Locked</span>
                : <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400"><WifiOff className="h-3 w-3" /> Offline</span>}
            </div>
            <div className="text-[11px] text-muted-foreground">{gw.host}</div>
          </div>
        </div>

        {gw.online && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((ch) => (
              <button
                key={ch.key}
                onClick={() => setFilter(ch.key)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  filter === ch.key
                    ? 'border-primary/50 bg-primary/10 text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                } ${ch.tone && filter !== ch.key ? ch.tone : ''}`}
              >
                {ch.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        {!gw.online ? (
          gw.locked ? (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <div className="font-medium">Gateway login temporarily locked</div>
                <div className="mt-0.5 text-amber-300/80">
                  Backing off to let the lock clear, then it will retry automatically. {gw.error}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <div className="font-medium">Couldn’t read this gateway</div>
                <div className="mt-0.5 text-red-300/80">{gw.error || 'Unknown error'}</div>
              </div>
            </div>
          )
        ) : ports.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No SIM ports match this filter.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {ports.map((p) => <PortCell key={`${gw.id}-${p.port}`} p={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GsmStatusPage() {
  const { data, isFetching, isLoading, refetch, error } =
    useGetGsmStatusQuery(undefined, { pollingInterval: 5000 });

  const t = data?.totals;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">GSM Gateways — SIM Status</h1>
            <p className="text-xs text-muted-foreground">
              Live busy / free SIMs across the Yeastar GSM gateways
              {data?.fetched_at ? ` · updated ${fmtTime(data.fetched_at)}` : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
        >
          {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </button>
      </div>

      {/* Summary tiles */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile icon={Smartphone} label="Total SIMs" value={t ? t.total : '—'} />
        <StatTile icon={CheckCircle2} label="Free" value={t ? t.free : '—'} tone="emerald" />
        <StatTile icon={PhoneCall} label="Busy" value={t ? t.busy : '—'} tone="amber" />
        <StatTile icon={XCircle} label="Offline" value={t ? t.offline : '—'} tone="slate" />
        <StatTile icon={Server} label="Gateways online" value={t ? `${t.online}/${t.gateways}` : '—'} />
      </div>

      {/* Loading / hard error */}
      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertTriangle className="h-4 w-4" />
          Failed to load GSM status.
        </div>
      ) : (
        <div className="space-y-4">
          {(data?.gateways || []).map((gw) => <GatewayCard key={gw.id} gw={gw} />)}
          {(data?.gateways || []).length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No GSM gateways configured.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
