import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { X, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

import { selectMaskPii, selectUser } from '@/features/auth/slices/authSlice';
import { maskPhone } from '@/shared/lib/mask';
import { dash } from '@/features/manager-view/utils';
import WhatsAppThread from '@/features/whatsapp/components/WhatsAppThread';
import { dispositionLabel } from '../utils';
import LeadInfoPanel, { Group, Stars } from './LeadInfoPanel';

// Row-detail modal for the Hot Meta Leads table — a pinned header + the shared LeadInfoPanel body
// (with the WhatsApp thread dropped into the panel's slot between Follow-up and Call Summary).
export default function LeadDetailModal({ lead, onClose }) {
  const maskPii = useSelector(selectMaskPii);
  const currentUser = useSelector(selectUser);
  const [showMore, setShowMore] = useState(false);

  // Esc to close + lock background scroll while open.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (!lead) return null;

  const name = lead.name || lead.vici_call_first_name;
  const dispo = dispositionLabel(lead.vici_call_status);
  // WhatsApp sender = the logged-in user (best-effort id/name).
  const agentName = currentUser?.full_name || currentUser?.user || null;
  const agentId = currentUser?.agent_id ?? currentUser?.user_id ?? currentUser?.user ?? null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-3xl max-h-[88vh] rounded-xl border border-border bg-card shadow-2xl flex flex-col animate-pop-in"
      >
        {/* Header (pinned) */}
        <div className="flex items-start justify-between gap-3 px-5 py-3.5 border-b border-border">
          <div className="min-w-0">
            <div className="text-[10px] text-primary uppercase tracking-widest mb-1">Lead #{dash(lead.lead_id)}</div>
            <div className="text-sm font-semibold text-foreground truncate">{dash(name)}</div>
            <div className="text-xs font-mono text-muted-foreground mt-0.5">{lead.phone ? (maskPii ? maskPhone(lead.phone) : lead.phone) : '—'}</div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex flex-col items-end gap-1">
              {dispo && (
                <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                  {dispo}
                </span>
              )}
              <Stars value={lead.call_rating} />
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 grid place-items-center rounded-lg border border-border bg-secondary/60 text-muted-foreground hover:text-foreground transition-smooth active:scale-90"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body (scroll) — WhatsApp first; the rest is tucked behind "See more details". */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-4">
          <Group title="WhatsApp" icon={MessageCircle}>
            <WhatsAppThread clientPhone={lead.phone} agentName={agentName} agentId={agentId} />
          </Group>

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary/40 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-smooth"
          >
            {showMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showMore ? 'Hide details' : 'See more details'}
          </button>

          {showMore && (
            <div className="space-y-5 animate-fade-in">
              <LeadInfoPanel lead={lead} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
