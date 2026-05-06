import { useState, useEffect } from 'react';
import { X, CalendarRange, ChevronsRight, Loader2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useToast } from '@/shared/hooks/useToast';
import { useSyncCampaignLeadRuleMutation } from '@/services';
import ConditionChip from './ConditionChip';

export default function SyncDrawer({ lead, onClose }) {
  const { success, error } = useToast();
  const [sd, setSd] = useState(null);
  const [ed, setEd] = useState(null);
  const [syncRule, { isLoading }] = useSyncCampaignLeadRuleMutation();
  const [result, setResult] = useState(null);

  useEffect(() => { setResult(null); setSd(null); setEd(null); }, [lead?.id]);

  if (!lead) return null;

  const toYMD = (d) => {
    if (!d) return undefined;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleRun = async () => {
    try {
      const params = {
        source:        lead.source        || undefined,
        form_name:     lead.form_name     || undefined,
        campaign_name: lead.campaign_name || undefined,
        sd: toYMD(sd),
        ed: toYMD(ed),
      };
      Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
      const res = await syncRule(params).unwrap();
      setResult(res);
      success(`Sync done — ${res.success ?? 0} leads pushed`);
    } catch {
      error('Sync failed — check the console');
    }
  };

  const stats = result
    ? [
        { label: 'Total',     v: result.total,       cls: 'text-slate-200' },
        { label: 'Pushed',    v: result.success,      cls: 'text-emerald-400' },
        { label: 'Duplicate', v: result.duplicate,    cls: 'text-amber-400'  },
        { label: 'Skipped',   v: result.skipped,      cls: 'text-sky-400'    },
        { label: 'Failed',    v: result.failed_count, cls: 'text-rose-400'   },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div onClick={onClose} className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
      <aside className="relative z-10 w-[400px] max-w-full h-full bg-gradient-to-b from-slate-900/95 to-slate-950
        border-l border-white/10 flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.7)]
        animate-[slideInRight_0.25s_cubic-bezier(0.22,1,0.36,1)]">

        <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] text-emerald-400 uppercase tracking-widest mb-1">Scoped Sync</div>
            <div className="text-sm font-semibold text-slate-100">{lead.campaign_name}</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <ConditionChip label="src"  value={lead.source} />
              <ConditionChip label="form" value={lead.form_name} />
              <ConditionChip label="→"    value={lead.destination_campaign} />
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white transition shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <p className="text-xs text-slate-500 leading-relaxed">
            Re-processes <span className="text-slate-400">meta_leads</span> matching this rule's conditions exactly.
            Optionally narrow by date range below.
          </p>

          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <CalendarRange className="w-3 h-3" /> Date range (optional)
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['From', sd, setSd], ['To', ed, setEd]].map(([label, val, set]) => (
                <div key={label}>
                  <div className="text-[10px] text-slate-600 mb-1">{label.toUpperCase()}</div>
                  <DatePicker
                    selected={val}
                    onChange={(d) => set(d)}
                    dateFormat="dd MMM yyyy"
                    maxDate={new Date()}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2
                      focus:outline-none focus:ring-1 focus:ring-sky-500/40"
                    popperClassName="z-[60] dark-datepicker"
                    placeholderText="Any date"
                  />
                </div>
              ))}
            </div>
          </div>

          {result && (
            <div className="rounded-xl border border-white/8 bg-slate-950/50 p-4">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Result</div>
              <div className="grid grid-cols-5 gap-2 text-center">
                {stats.map(({ label, v, cls }) => (
                  <div key={label}>
                    <div className={`text-xl font-bold font-mono ${cls}`}>{v}</div>
                    <div className="text-[9px] text-slate-600 uppercase tracking-wider mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
              {result.failed?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/6">
                  <div className="text-[10px] text-rose-400 uppercase tracking-widest mb-2">Failed</div>
                  <div className="space-y-1 max-h-28 overflow-y-auto scrollbar-thin">
                    {result.failed.map((f, i) => (
                      <div key={i} className="text-[11px] text-slate-500 font-mono">
                        {f.phone} — <span className="text-rose-400/70">{f.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/10 flex gap-3">
          <button
            onClick={handleRun}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5
              bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold
              disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronsRight className="w-4 h-4" />}
            {isLoading ? 'Running…' : 'Run Sync'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/8 text-sm transition"
          >
            Close
          </button>
        </div>
      </aside>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
