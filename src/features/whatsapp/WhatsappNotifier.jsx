import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectUser, selectIsAdmin } from '@/features/auth/slices/authSlice';
import { useGetUnreadInboundQuery } from '@/services';
import { useToast } from '@/shared/hooks/useToast';

// App-wide (agent panel): polls for unseen inbound WhatsApp replies on the
// agent's own conversations and pops a toast when a NEW one arrives — so agents
// are alerted even when they're not on the WhatsApp/lead screen.
export default function WhatsappNotifier() {
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);
  const agentId = user?.user || user?.agent_id || null;
  const { info } = useToast();

  // Agents only (admins have the console with unread badges).
  const { data: unread = [] } = useGetUnreadInboundQuery(agentId, {
    skip: !user || isAdmin,
    pollingInterval: 10000,
  });

  const knownRef = useRef(null); // null until the first poll baselines existing unread

  useEffect(() => {
    const ids = new Set(unread.map((u) => u.id));
    // First load: record what's already unread WITHOUT toasting (no burst on login).
    if (knownRef.current === null) {
      knownRef.current = ids;
      return;
    }
    const fresh = unread.filter((u) => !knownRef.current.has(u.id));
    knownRef.current = ids;
    fresh
      .slice(0, 5)
      .forEach((u) =>
        info(`💬 WhatsApp reply from ${u.client_phone}: ${String(u.body || '').slice(0, 50)}`),
      );
  }, [unread, info]);

  return null;
}
