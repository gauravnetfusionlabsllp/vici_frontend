import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Bell, X, MessageCircle } from 'lucide-react';

import { selectUser } from '@/features/auth/slices/authSlice';
import { useGetUnreadInboundQuery } from '@/services';
import WhatsAppThread from './components/WhatsAppThread';
import { fmtTime } from './utils';

// Persistent WhatsApp notification tab for the top nav. Shows a bell with an
// unread badge; the dropdown lists every conversation that has unseen client
// replies. Opening a conversation renders the chat (which marks it seen), so
// the item drops off the list automatically. Polls the same agent-scoped
// unread feed the toast notifier uses.
export default function NotificationBell() {
  const user = useSelector(selectUser);
  const agentId = user?.agent_id ?? user?.user_id ?? user?.user ?? null;
  const agentName = user?.full_name || user?.user || null;

  const [open, setOpen] = useState(false);
  const [chatPhone, setChatPhone] = useState(null);
  const ref = useRef(null);

  const { data: unread = [] } = useGetUnreadInboundQuery(agentId, {
    skip: !user,
    pollingInterval: 10000,
  });

  // Collapse the flat unread list into one entry per client phone, newest body
  // first, with an unseen count.
  const convos = useMemo(() => {
    const map = new Map();
    for (const m of unread) {
      const p = String(m.client_phone || '').trim();
      if (!p) continue;
      const prev = map.get(p);
      if (!prev) map.set(p, { phone: p, body: m.body, ts: m.ts, count: 1 });
      else prev.count += 1;
    }
    return Array.from(map.values());
  }, [unread]);

  const total = unread.length;

  // Close the dropdown on an outside click.
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-md border border-slate-700 bg-slate-800/60 text-muted-foreground hover:text-foreground transition-smooth"
        title="WhatsApp replies"
        aria-label="WhatsApp notifications"
      >
        <Bell className="h-4 w-4" />
        {total > 0 && (
          <span className="absolute -top-1 -right-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto scrollbar-thin rounded-xl border border-border bg-card shadow-2xl z-50 animate-pop-in">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-semibold text-foreground">WhatsApp replies</span>
            <span className="text-[11px] text-muted-foreground">{total} unread</span>
          </div>

          {convos.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 py-8 text-muted-foreground">
              <MessageCircle className="h-5 w-5" />
              <p className="text-xs">No new messages</p>
            </div>
          ) : (
            convos.map((c) => (
              <button
                key={c.phone}
                type="button"
                onClick={() => {
                  setChatPhone(c.phone);
                  setOpen(false);
                }}
                className="w-full border-b border-border/50 px-3 py-2 text-left hover:bg-secondary/40 transition-smooth"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-xs text-foreground">{c.phone}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    {c.ts && <span className="text-[10px] text-muted-foreground">{fmtTime(c.ts)}</span>}
                    <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {c.count}
                    </span>
                  </div>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{c.body || '—'}</p>
              </button>
            ))
          )}
        </div>
      )}

      {/* Chat popup for a chosen conversation — opening it marks the thread seen. */}
      {chatPhone && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4">
          <div
            onClick={() => setChatPhone(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
          />
          <div className="relative z-10 flex h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl animate-pop-in">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="font-mono text-sm text-foreground">{chatPhone}</span>
              </div>
              <button
                type="button"
                onClick={() => setChatPhone(null)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-smooth"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 p-3">
              <WhatsAppThread clientPhone={chatPhone} agentName={agentName} agentId={agentId} fill />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
