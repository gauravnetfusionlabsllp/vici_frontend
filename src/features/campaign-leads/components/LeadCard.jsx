import { Loader2, Pause, Play, ChevronsRight, Infinity, Trash2 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import ConditionChip from './ConditionChip';
import { routeStatus, fmtDate } from '../utils';

export default function LeadCard({ lead, onToggle, onSync, onDelete, toggling, deleting }) {
  const status = routeStatus(lead);

  return (
    <div className={`group relative overflow-hidden border rounded-xl
      bg-gradient-to-b from-slate-900/60 to-slate-950/70
      transition-smooth hover-lift
      hover:shadow-[0_12px_36px_rgba(0,0,0,0.6)]
      ${status === 'live' ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-white/8 hover:border-white/[0.14]'}
    `}>
      {status === 'live' && (
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
      )}

      <div className="relative p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={status} />
              <span className="text-[10px] text-slate-600 font-mono">#{lead.id}</span>
            </div>
            <div className="text-sm font-semibold text-slate-100 truncate">{lead.rule_name}</div>
            <div className="text-[11px] text-slate-500 font-mono truncate">→ {lead.destination_campaign}</div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onToggle(lead.id)}
              disabled={toggling}
              title={lead.isactive ? 'Pause rule' : 'Resume rule'}
              className={`h-8 w-8 grid place-items-center rounded-lg border transition-smooth active:scale-90
                ${lead.isactive
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300'
                  : 'border-slate-600/40 bg-slate-800/40 text-slate-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-300'
                }
                disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {toggling
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : lead.isactive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />
              }
            </button>

            <button
              onClick={() => onDelete(lead)}
              disabled={deleting}
              title="Delete rule"
              className="h-8 w-8 grid place-items-center rounded-lg border transition-smooth active:scale-90
                border-rose-500/25 bg-rose-500/5 text-rose-300/80
                hover:bg-rose-500/15 hover:border-rose-500/40 hover:text-rose-300
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {deleting
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />
              }
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <ConditionChip label="src"  value={lead.source} />
          <ConditionChip label="form" value={lead.form_name} />
          <ConditionChip label="from" value={fmtDate(lead.startdate)} />
          {lead.enddate
            ? <ConditionChip label="until" value={fmtDate(lead.enddate)} />
            : (
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] border
                bg-emerald-500/10 border-emerald-500/25 text-emerald-300">
                <Infinity className="w-2.5 h-2.5" /> realtime · no expiry
              </span>
            )
          }
        </div>

        <button
          onClick={() => onSync(lead)}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-700/60
            py-1.5 text-[11px] text-slate-500 font-medium tracking-wider uppercase
            hover:border-emerald-500/40 hover:text-emerald-400 hover:bg-emerald-500/5
            transition-smooth active:scale-[0.98]"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
          Sync this rule
        </button>
      </div>
    </div>
  );
}
