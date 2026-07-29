import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { MessageCircle, AlertTriangle, Info, Loader2, PowerOff } from 'lucide-react';
import { useWaConnected } from '@/features/whatsapp/useWaConnected';

import { selectUser, selectIsAdmin } from '@/features/auth/slices/authSlice';
import { useGetWhatsappMessagesQuery, useGetHotMetaLeadsQuery, useGetMetaLeadByPhoneQuery } from '@/services';
import { SkeletonList } from '@/shared/components/ui';
import WhatsAppThread from '@/features/whatsapp/components/WhatsAppThread';
import LeadInfoPanel from '@/features/reporting/components/LeadInfoPanel';
import { renderMessageBody, parseApiError, isPending } from '@/features/whatsapp/utils';
import ConversationList from './components/ConversationList';

// Phone matching: compare digits-only, falling back to the trailing 10 digits so a stored lead
// phone missing/adding a country code still matches the WhatsApp `client_phone`.
const digitsOnly = (s) => String(s ?? '').replace(/\D/g, '');
function phoneMatches(a, b) {
  const da = digitsOnly(a);
  const db = digitsOnly(b);
  if (!da || !db) return false;
  if (da === db) return true;
  const la = da.slice(-10);
  const lb = db.slice(-10);
  return la.length === 10 && la === lb;
}

// The slim by-phone meta record uses `raw_fields`; map it onto the panel's `raw_data` key.
const adaptSlim = (slim) => ({ ...slim, raw_data: slim.raw_data ?? slim.raw_fields });

// Collapse the flat (newest-first) message feed into one row per client_phone, keeping the latest
// message's body as the preview and counting messages. Order follows the feed, so latest-first.
function groupConversations(messages) {
  const map = new Map();
  for (const m of messages) {
    const phone = (m.client_phone ?? '').toString().trim();
    if (!phone) continue;
    const msg = m.message || {};
    // Unread = an inbound (client) message not yet marked seen.
    const unread = String(msg.direction || '').toLowerCase() === 'inbound' && msg.seen !== true;
    const existing = map.get(phone);
    if (!existing) {
      map.set(phone, { phone, lastBody: renderMessageBody(msg), count: 1, unread: unread ? 1 : 0 });
    } else {
      existing.count += 1;
      if (unread) existing.unread += 1;
    }
  }
  return Array.from(map.values());
}

export default function WhatsAppAdminPage() {
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);
  const agentName = user?.full_name || user?.user || null;
  const agentId = user?.agent_id ?? user?.user_id ?? user?.user ?? null;

  // Admins see every conversation; agents see only their own (phones they've
  // messaged). Scoping is done server-side via the agent_id query param.
  const messagesArg = isAdmin ? undefined : (agentId ? { agentId } : undefined);

  const { connected: waConnected } = useWaConnected();
  const { data: messages = [], isLoading, isError, error } = useGetWhatsappMessagesQuery(messagesArg, {
    pollingInterval: 5000,
    skip: !waConnected, // don't even fetch history while WhatsApp is logged out
  });
  // Rich lead lookup: the whole hot-meta-leads feed (RTK-cached; reused from the reporting page).
  const { data: leads = [], isFetching: leadsFetching } = useGetHotMetaLeadsQuery();

  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  const conversations = useMemo(() => groupConversations(messages), [messages]);
  const pendingCount = useMemo(() => messages.filter((m) => isPending(m.message)).length, [messages]);

  // Full lead for the open conversation: match by phone in the rich feed, else the slim by-phone
  // meta record (skipped when a rich match already exists or nothing is selected).
  const matchedLead = useMemo(
    () => (selected ? leads.find((l) => phoneMatches(l.phone, selected)) || null : null),
    [leads, selected],
  );
  const { data: slim, isFetching: slimFetching } = useGetMetaLeadByPhoneQuery(
    selected ? digitsOnly(selected) : '',
    { skip: !selected || !!matchedLead },
  );
  const infoLead = matchedLead || (slim ? adaptSlim(slim) : null);
  const infoLoading = !!selected && !infoLead && (leadsFetching || slimFetching);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.phone.toLowerCase().includes(q));
  }, [conversations, search]);

  // Open a chat for any number (even one with no history yet).
  const handleNewChat = (phone) => {
    setSearch('');
    setSelected(phone.trim());
  };

  return (
    <div className="space-y-2 stagger-children">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-b from-card/70 to-card/40 px-4 py-2.5 transition-smooth">
        <div className="pointer-events-none absolute inset-0 opacity-60
          bg-[radial-gradient(700px_circle_at_0%_0%,hsl(var(--primary)/0.10),transparent_55%),
             radial-gradient(600px_circle_at_100%_100%,hsl(var(--primary)/0.06),transparent_55%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg border border-primary/30 bg-primary/10 grid place-items-center shrink-0">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground leading-none">WhatsApp</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isAdmin ? 'All conversations' : 'Your conversations'} — send and track messages
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatPill label="Conversations" value={conversations.length} />
            <StatPill label="Messages" value={messages.length} tone="primary" />
            <StatPill label="Pending" value={pendingCount} tone="warn" />
          </div>
        </div>
      </div>

      {/* Two-pane console */}
      <div className="rounded-xl border border-border bg-card/60 overflow-hidden transition-smooth">
        {!waConnected ? (
          <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground animate-fade-in">
            <PowerOff className="w-8 h-8" />
            <p className="text-sm font-medium text-foreground">WhatsApp is logged out</p>
            <p className="max-w-sm text-center text-xs">
              Conversations are hidden until a session is connected. Reconnect on the WhatsApp Sessions page.
            </p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-destructive animate-fade-in">
            <AlertTriangle className="w-8 h-8" />
            <p className="text-sm">{parseApiError(error).message}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,280px)_1fr_minmax(300px,360px)] h-[calc(100vh-11rem)] min-h-[520px]">
            {/* Left rail — conversations */}
            <div className="border-b lg:border-b-0 lg:border-r border-border min-h-0">
              {isLoading ? (
                <div className="p-3">
                  <SkeletonList count={8} itemHeight={44} />
                </div>
              ) : (
                <ConversationList
                  conversations={filtered}
                  selected={selected}
                  onSelect={setSelected}
                  search={search}
                  onSearch={setSearch}
                  onNewChat={handleNewChat}
                />
              )}
            </div>

            {/* Center — chat thread */}
            <div className="min-h-0 p-3 flex flex-col border-b lg:border-b-0 lg:border-r border-border">
              {selected ? (
                <>
                  <div className="text-xs font-mono text-foreground/80 mb-2 shrink-0">{selected}</div>
                  <div className="flex-1 min-h-0">
                    <WhatsAppThread clientPhone={selected} agentName={agentName} agentId={agentId} fill />
                  </div>
                </>
              ) : (
                <div className="h-full grid place-items-center text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <MessageCircle className="w-6 h-6" />
                    <p className="text-sm">Select a conversation or start a new chat</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right — lead info for the selected number */}
            <div className="min-h-0 overflow-y-auto scrollbar-thin p-3">
              {!selected ? (
                <div className="h-full grid place-items-center text-center text-muted-foreground">
                  <p className="text-xs">Lead details appear here.</p>
                </div>
              ) : infoLead ? (
                <div className="space-y-5">
                  <LeadInfoPanel lead={infoLead} />
                </div>
              ) : infoLoading ? (
                <div className="h-full grid place-items-center text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 text-xs"><Loader2 className="w-4 h-4 animate-spin" /> Loading lead…</span>
                </div>
              ) : (
                <div className="h-full grid place-items-center text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Info className="w-5 h-5" />
                    <p className="text-xs">No lead details for this number.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value, tone = 'default' }) {
  const toneCls = {
    default: 'text-foreground',
    primary: 'text-primary',
    warn: 'text-[hsl(var(--status-waiting))]',
  }[tone];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/40 px-2.5 py-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-mono-nums font-semibold ${toneCls}`}>{value}</span>
    </span>
  );
}
