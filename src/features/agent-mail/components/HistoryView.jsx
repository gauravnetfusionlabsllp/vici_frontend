import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RefreshCw, Search, CheckCircle2, XCircle, Paperclip, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { useGetAgentEmailSendLogQuery } from '@/services';
import { selectMaskPii } from '@/features/auth/slices/authSlice';
import { maskEmailList } from '@/shared/lib/mask';
import { fmtDate } from '../utils/format';

export default function HistoryView() {
  const maskPii = useSelector(selectMaskPii);
  const [leadFilter, setLeadFilter] = useState('');
  const [appliedLead, setAppliedLead] = useState(undefined);
  const [expanded, setExpanded] = useState(null);

  const { data: log = [], isLoading, isFetching, refetch } = useGetAgentEmailSendLogQuery({
    limit: 50,
    lead_id: appliedLead,
  });

  const applyFilter = (e) => {
    e?.preventDefault?.();
    const trimmed = leadFilter.trim();
    setAppliedLead(trimmed ? trimmed : undefined);
  };

  const clearFilter = () => { setLeadFilter(''); setAppliedLead(undefined); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <form onSubmit={applyFilter} className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/40 px-2 py-1.5">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={leadFilter}
              onChange={(e) => setLeadFilter(e.target.value)}
              placeholder="Filter by lead ID…"
              className="w-44 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground/70"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 transition"
          >
            Apply
          </button>
          {appliedLead && (
            <button
              type="button"
              onClick={clearFilter}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-foreground text-xs hover:bg-white/10 transition"
            >
              Clear
            </button>
          )}
        </form>

        <button
          onClick={refetch}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-foreground text-xs hover:bg-white/10 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
      ) : log.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-slate-800/60 border border-white/10 grid place-items-center">
            <Mail className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No sent emails yet.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {log.map((r) => {
            const isOpen = expanded === r.id;
            const failed = r.status !== 'sent';
            return (
              <div
                key={r.id}
                className={`rounded-xl border bg-slate-950/30 transition
                  ${failed ? 'border-destructive/30 hover:border-destructive/50' : 'border-white/10 hover:border-white/20'}`}
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                >
                  {failed
                    ? <XCircle className="w-4 h-4 text-destructive shrink-0" />
                    : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  }
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground font-medium truncate">{r.subject || '(no subject)'}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {maskPii ? maskEmailList(r.to_emails) : r.to_emails}
                      {r.recipient_name && <span> · {r.recipient_name}</span>}
                      {r.lead_id != null && <span> · #{r.lead_id}</span>}
                    </p>
                  </div>
                  <div className="hidden md:flex items-center gap-3 text-[11px] text-muted-foreground shrink-0">
                    {r.template_name && (
                      <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-foreground/80">
                        {r.template_name}
                      </span>
                    )}
                    {r.attachment_count > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Paperclip className="w-3 h-3" /> {r.attachment_count}
                      </span>
                    )}
                    <span>{fmtDate(r.sent_at)}</span>
                  </div>
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  }
                </button>

                {isOpen && (
                  <div className="px-3 pb-3 pt-1 border-t border-white/10 space-y-2 animate-fade-in-down">
                    {failed && r.error_detail && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        {r.error_detail}
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                      <Meta label="From"    value={r.from_email} />
                      <Meta label="To"      value={maskPii ? maskEmailList(r.to_emails) : r.to_emails} />
                      <Meta label="Cc"      value={(maskPii ? maskEmailList(r.cc) : r.cc) || '—'} />
                      <Meta label="Sent at" value={fmtDate(r.sent_at)} />
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Body</p>
                      <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto scrollbar-thin">
                        {r.body_sent || '—'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-foreground truncate">{value || '—'}</p>
    </div>
  );
}
