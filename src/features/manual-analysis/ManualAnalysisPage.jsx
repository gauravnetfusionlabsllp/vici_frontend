import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FileAudio, Play, RotateCw, Trash2 } from 'lucide-react';
import {
  useGetManualAnalysesQuery,
  useAnalyzeManualRecordingsMutation,
  useDeleteManualRecordingMutation,
} from '@/services';
import UploadCard from './components/UploadCard';
import AnalysisDetail from './components/AnalysisDetail';
import ConfirmDeletePopup from '@/shared/components/ConfirmDeletePopup';

const STATUS_STYLE = {
  uploaded:   'bg-slate-500/20 text-slate-300',
  pending:    'bg-sky-500/15 text-sky-300',
  processing: 'bg-sky-500/25 text-sky-200 animate-pulse',
  successful: 'bg-emerald-500/15 text-emerald-300',
  not_picked: 'bg-amber-500/15 text-amber-300',
  skipped:    'bg-amber-500/15 text-amber-300',
  failed:     'bg-red-500/15 text-red-300',
};
const STATUS_LABEL = {
  uploaded: 'Uploaded', pending: 'Queued', processing: 'Analysing…', successful: 'Analysed',
  not_picked: 'Not connected', skipped: 'No speech', failed: 'Failed',
};
const RUNNABLE = ['uploaded', 'failed', 'skipped', 'not_picked'];
const ACTIVE = ['pending', 'processing'];

export default function ManualAnalysisPage() {
  // Poll only while something is queued or being analysed. The first subscription
  // reads the cache; the second shares it and is the one that polls.
  const { data: cached } = useGetManualAnalysesQuery();
  const pollMs = (cached?.data ?? []).some((r) => ACTIVE.includes(r.status)) ? 3000 : 0;
  const { data, isLoading, isError, refetch } = useGetManualAnalysesQuery(undefined, { pollingInterval: pollMs });
  const [analyze, { isLoading: isQueuing }] = useAnalyzeManualRecordingsMutation();
  const [remove, { isLoading: isDeleting }] = useDeleteManualRecordingMutation();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selected, setSelected] = useState([]);
  const [openId, setOpenId] = useState(null);

  const rows = useMemo(() => data?.data ?? [], [data]);

  const runnableSelected = selected.filter((id) => RUNNABLE.includes(rows.find((r) => r.id === id)?.status));

  const queue = async (ids) => {
    if (!ids.length) return;
    try {
      const res = await analyze(ids).unwrap();
      toast.success(`${res.queued.length} recording(s) queued for analysis`);
      setSelected([]);
    } catch {
      toast.error('Could not start the analysis');
    }
  };

  const confirmDelete = async () => {
    const row = deleteTarget;
    if (!row) return;
    try {
      await remove(row.id).unwrap();
      setSelected((s) => s.filter((id) => id !== row.id));
      if (openId === row.id) setOpenId(null);
      toast.success('Recording deleted');
    } catch (e) {
      toast.error(e?.data?.detail || 'Delete failed');
    } finally {
      setDeleteTarget(null);
    }
  };

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="min-h-screen p-4 md:p-6 bg-[hsl(231_58%_6%)] text-white">
      <div className="mx-auto max-w-[1440px] space-y-5">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/70 to-slate-950/80 px-5 py-5">
          <div className="relative flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-sky-400/20 bg-sky-500/10">
              <FileAudio className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-none text-slate-100">Manual Analysis</h1>
              <p className="mt-1 text-xs text-slate-400">
                Upload call recordings and score them with the same AI used for dialer calls
              </p>
            </div>
          </div>
        </div>

        <UploadCard />

        <div className="rounded-xl border border-border bg-card/60 p-4 md:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-slate-300">
              {data?.total ?? 0} recording{data?.total === 1 ? '' : 's'}
              {pollMs > 0 && <span className="ml-2 text-xs text-sky-300">· analysing, refreshing…</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={refetch} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5">
                Refresh
              </button>
              <button
                onClick={() => queue(runnableSelected)} disabled={!runnableSelected.length || isQueuing}
                className="rounded-lg border border-sky-500/40 bg-sky-500/15 px-3 py-1.5 text-xs font-medium text-sky-200 hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Analyse selected ({runnableSelected.length})
              </button>
            </div>
          </div>

          {isLoading && <p className="py-8 text-center text-sm text-slate-400">Loading…</p>}
          {isError && <p className="py-8 text-center text-sm text-red-400">Failed to load recordings</p>}
          {!isLoading && !isError && rows.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">No recordings uploaded yet.</p>
          )}

          {rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="w-8 py-2" />
                    <th className="py-2 pr-3">File</th>
                    <th className="py-2 pr-3">Uploaded</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Rating</th>
                    <th className="py-2 pr-3">Outcome</th>
                    <th className="py-2 pr-3">Summary</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} onClick={() => setOpenId(r.id)}
                        className="cursor-pointer border-b border-white/5 hover:bg-white/[0.04]">
                      <td className="py-2" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} />
                      </td>
                      <td className="max-w-[220px] truncate py-2 pr-3 text-slate-100" title={r.original_filename}>
                        {r.original_filename}
                        {(r.agent_name || r.client_name) && (
                          <div className="truncate text-xs text-slate-500">
                            {[r.agent_name, r.client_name].filter(Boolean).join(' → ')}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap py-2 pr-3 text-xs text-slate-400">
                        {r.uploaded_by}
                        <div>{r.uploaded_at ? new Date(r.uploaded_at).toLocaleString() : ''}</div>
                      </td>
                      <td className="py-2 pr-3">
                        <span className={`rounded px-2 py-0.5 text-xs ${STATUS_STYLE[r.status] || ''}`}>
                          {STATUS_LABEL[r.status] || r.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-2 pr-3 text-slate-200">
                        {r.overall_rating != null ? `${r.overall_rating}/5` : '—'}
                      </td>
                      <td className="py-2 pr-3 text-slate-300">{r.call_outcome || '—'}</td>
                      <td className="max-w-[320px] truncate py-2 pr-3 text-slate-400" title={r.summary || ''}>
                        {r.summary || (r.status === 'failed' ? r.error : '—')}
                      </td>
                      <td className="whitespace-nowrap py-2 text-right" onClick={(e) => e.stopPropagation()}>
                        {RUNNABLE.includes(r.status) && (
                          <button onClick={() => queue([r.id])} title={r.status === 'uploaded' ? 'Analyse' : 'Re-analyse'}
                                  className="mr-2 inline-flex items-center gap-1 rounded-md border border-sky-500/40 bg-sky-500/10 px-2 py-1 text-xs text-sky-200 hover:bg-sky-500/20">
                            {r.status === 'uploaded' ? <Play className="h-3.5 w-3.5" /> : <RotateCw className="h-3.5 w-3.5" />}
                            {r.status === 'uploaded' ? 'Analyse' : 'Re-analyse'}
                          </button>
                        )}
                        {!ACTIVE.includes(r.status) && (
                          <button onClick={() => setDeleteTarget(r)} title="Delete" className="text-slate-500 hover:text-red-400">
                            <Trash2 className="inline h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {openId && <AnalysisDetail id={openId} onClose={() => setOpenId(null)} />}

      <ConfirmDeletePopup
        open={!!deleteTarget}
        title="Delete Recording"
        message={`Delete "${deleteTarget?.original_filename}" and its analysis? This cannot be undone.`}
        loading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
