import { useEffect, useState } from 'react';
import { X, Star } from 'lucide-react';
import { useGetManualAnalysisQuery, useGetManualRecordingAudioMutation } from '@/services';
import RecordingPlayer from '@/features/reporting/components/RecordingPlayer';

function Section({ title, children }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      {children}
    </div>
  );
}

function Stars({ value }) {
  const n = Number(value) || 0;
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${i <= n ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
      ))}
    </span>
  );
}

export default function AnalysisDetail({ id, onClose }) {
  // Refresh while the recording is queued / being analysed, so the panel fills in.
  // The first subscription reads the cache; the second shares it and polls.
  const { data: cached } = useGetManualAnalysisQuery(id, { skip: !id });
  const pollMs = ['pending', 'processing'].includes(cached?.data?.status) ? 3000 : 0;
  const { data, isLoading } = useGetManualAnalysisQuery(id, { skip: !id, pollingInterval: pollMs });
  const [fetchAudio] = useGetManualRecordingAudioMutation();
  const [audioUrl, setAudioUrl] = useState(null);
  const row = data?.data;

  useEffect(() => {
    let url = null;
    fetchAudio(id).unwrap().then((u) => { url = u; setAudioUrl(u); }).catch(() => setAudioUrl(null));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [id, fetchAudio]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-slate-950 p-5 space-y-5 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-100">{row?.original_filename || 'Recording'}</h2>
            <p className="text-xs text-slate-500">
              Uploaded by {row?.uploaded_by || '—'} · {row?.uploaded_at ? new Date(row.uploaded_at).toLocaleString() : '—'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100"><X className="h-5 w-5" /></button>
        </div>

        {audioUrl
          ? <RecordingPlayer src={audioUrl} title={row?.original_filename} />
          : <p className="text-sm text-slate-500">Loading audio…</p>}

        {isLoading && <p className="text-sm text-slate-400">Loading analysis…</p>}

        {row && ['pending', 'processing'].includes(row.status) && (
          <p className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-200">
            {row.status === 'pending' ? 'Queued for analysis…' : 'Analysing — transcribing and scoring the call…'}
          </p>
        )}

        {row && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg bg-white/[0.04] p-3">
                <div className="text-xs text-slate-500">Rating</div>
                <div className="mt-1 text-lg font-semibold text-slate-100">
                  {row.overall_rating != null ? `${row.overall_rating}/5` : '—'}
                </div>
                <Stars value={row.stars} />
              </div>
              <div className="rounded-lg bg-white/[0.04] p-3">
                <div className="text-xs text-slate-500">Outcome</div>
                <div className="mt-1 text-sm text-slate-100">{row.call_outcome || '—'}</div>
              </div>
              <div className="rounded-lg bg-white/[0.04] p-3">
                <div className="text-xs text-slate-500">Agent sentiment</div>
                <div className="mt-1 text-sm text-slate-100">{row.agent_sentiment || '—'}</div>
              </div>
              <div className="rounded-lg bg-white/[0.04] p-3">
                <div className="text-xs text-slate-500">Client sentiment</div>
                <div className="mt-1 text-sm text-slate-100">{row.client_sentiment || '—'}</div>
              </div>
            </div>

            {row.status === 'failed' && row.error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{row.error}</p>
            )}

            {row.summary && (
              <Section title="Summary"><p className="text-sm text-slate-200">{row.summary}</p></Section>
            )}

            {row.rating_breakdown && (
              <Section title="Rating breakdown">
                <pre className="whitespace-pre-wrap rounded-lg bg-white/[0.04] p-3 font-sans text-sm text-slate-200">
                  {row.rating_breakdown}
                </pre>
              </Section>
            )}

            {row.strengths?.length > 0 && (
              <Section title="Strengths">
                <ul className="list-disc pl-5 text-sm text-emerald-200 space-y-0.5">
                  {row.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </Section>
            )}

            {row.improvements?.length > 0 && (
              <Section title="Improvements">
                <ul className="list-disc pl-5 text-sm text-amber-200 space-y-0.5">
                  {row.improvements.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </Section>
            )}

            {row.transcript && (
              <Section title="Transcript">
                <pre className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-lg bg-white/[0.04] p-3 font-sans text-sm text-slate-300">
                  {row.transcript}
                </pre>
              </Section>
            )}

            {row.notes && (
              <Section title="Notes"><p className="text-sm text-slate-300">{row.notes}</p></Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
