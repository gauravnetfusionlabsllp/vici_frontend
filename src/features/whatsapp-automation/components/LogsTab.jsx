import { useState } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import { SkeletonTable } from '@/shared/components/ui';
import { useGetWaAutoLogQuery } from '@/services';
import { StatusBadge } from './ui';
import { fmtDateTime } from '../utils';

const FILTERS = [
  { key: '',         label: 'All' },
  { key: 'sent',     label: 'Sent' },
  { key: 'failed',   label: 'Failed' },
  { key: 'no_match', label: 'No match' },
  { key: 'skipped',  label: 'Skipped' },
];

export default function LogsTab() {
  const [status, setStatus] = useState('');
  const { data, isLoading, isFetching, refetch } =
    useGetWaAutoLogQuery({ limit: 200, status: status || undefined });

  const rows = data?.rows ?? [];
  const stats = data?.stats ?? {};

  return (
    <div className="space-y-4">
      {/* 7-day summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {['sent', 'failed', 'no_match', 'skipped'].map((k) => (
          <div key={k} className="rounded-xl border border-white/8 bg-slate-950/40 px-4 py-3">
            <p className="text-[11px] uppercase tracking-widest text-slate-500">
              {k.replace('_', ' ')}
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-100 tabular-nums">{stats[k] ?? 0}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-600 -mt-1">Counts cover the last 7 days.</p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setStatus(f.key)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition
                ${status === f.key
                  ? 'border-sky-500/40 bg-sky-500/15 text-sky-200'
                  : 'border-white/8 bg-white/[0.03] text-slate-400 hover:text-slate-200'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={refetch} disabled={isFetching} title="Refresh"
          className="h-7 w-7 grid place-items-center rounded-lg border border-white/10 bg-white/5
            text-slate-500 hover:text-slate-300 hover:bg-white/8 transition">
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : rows.length === 0 ? (
        <div className="py-14 flex flex-col items-center gap-3 animate-fade-in-up">
          <div className="h-12 w-12 rounded-xl bg-slate-800/60 border border-white/10 grid place-items-center">
            <Activity className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-sm text-slate-400">Nothing here yet</p>
          <p className="text-xs text-slate-600">Activity appears as soon as new leads arrive.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/8">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="bg-slate-950/60 text-left text-[11px] uppercase tracking-widest text-slate-500">
                <Th>When</Th><Th>Phone</Th><Th>Source</Th><Th>Campaign</Th>
                <Th>Template</Th><Th>Status</Th><Th>Message</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.03] transition">
                  <Td className="whitespace-nowrap text-slate-400">{fmtDateTime(r.created_at)}</Td>
                  <Td className="font-mono text-xs text-slate-300">{r.phone || '—'}</Td>
                  <Td className="text-slate-400">{r.source || '—'}</Td>
                  <Td className="text-slate-400 max-w-[10rem] truncate" title={r.campaign_name}>
                    {r.campaign_name || '—'}
                  </Td>
                  <Td className="text-slate-300 max-w-[10rem] truncate" title={r.template_name}>
                    {r.template_name || '—'}
                  </Td>
                  <Td><StatusBadge status={r.status} /></Td>
                  <Td className="max-w-[18rem]">
                    <span className="block truncate text-slate-400" title={r.detail || r.body_sent || ''}>
                      {r.detail || r.body_sent || '—'}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const Th = ({ children }) => <th className="px-3 py-2 font-medium">{children}</th>;
const Td = ({ children, className = '' }) => <td className={`px-3 py-2 ${className}`}>{children}</td>;
