import { format } from 'date-fns';

// Build the outbound `message` JSON we POST. The agent only *queues* the message — it starts as
// `pending` and an admin later dispatches it to WhatsApp (flipping status to `sent`).
export function buildOutboundMessage(body) {
  return {
    type: 'text',
    body: String(body ?? '').trim(),
    direction: 'outbound',
    status: 'pending',
    // Distinguishes agent-composed messages from the ones the lead automation
    // sends by itself (which are stamped 'auto' server-side).
    send_type: 'manual',
    timestamp: new Date().toISOString(),
  };
}

// A message is "pending" (awaiting admin dispatch) when explicitly marked so, or when it's an
// outbound message with no status yet (legacy rows created before the pending/sent model).
export function isPending(message) {
  const s = String(message?.status || '').toLowerCase();
  if (s) return s === 'pending';
  return String(message?.direction || '').toLowerCase() === 'outbound';
}

// Flip a stored message to sent (called after the admin opens WhatsApp for it).
export function markMessageSent(message) {
  const base = message && typeof message === 'object' ? message : {};
  return { ...base, status: 'sent', sent_at: new Date().toISOString() };
}

// WhatsApp click-to-chat URL: digits-only phone + URL-encoded prefilled text.
export function whatsappSendUrl(phone, body) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  const text = String(body ?? '');
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

// Token-based tone for a status label (used to tint the bubble status tag).
export function statusTone(status) {
  switch (String(status || '').toLowerCase()) {
    case 'read':
      return 'text-sky-400 bg-sky-500/12';                 // seen (✓✓ blue)
    case 'delivered':
      return 'text-emerald-400 bg-emerald-500/12';         // delivered (✓✓)
    case 'sent':
      return 'text-[hsl(var(--status-active))] bg-[hsl(var(--status-active)/0.12)]';
    case 'pending':
      return 'text-[hsl(var(--status-waiting))] bg-[hsl(var(--status-waiting)/0.12)]';
    case 'failed':
      return 'text-destructive bg-destructive/12';
    default:
      return 'text-muted-foreground bg-secondary/50';
  }
}

// `message` is arbitrary JSON. Prefer the conventional `body`; fall back to a compact JSON dump so
// off-convention payloads still render something readable.
export function renderMessageBody(message) {
  if (message == null) return '';
  if (typeof message === 'string') return message;
  if (typeof message === 'object') {
    if (typeof message.body === 'string') return message.body;
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }
  return String(message);
}

// Normalize an RTK Query error into { fieldError, message }.
//  - 422 → detail is an array of { loc, msg }; the entry whose loc mentions client_phone becomes a
//    field-level error, the rest are joined into the banner/toast message.
//  - 500 / others → detail is a string (or fall back through the app's standard chain).
export function parseApiError(e) {
  const detail = e?.data?.detail;
  if (Array.isArray(detail)) {
    const phoneErr = detail.find((d) => Array.isArray(d?.loc) && d.loc.includes('client_phone'));
    const message = detail.map((d) => d?.msg).filter(Boolean).join(' ') || 'Validation error';
    return { fieldError: phoneErr?.msg || null, message };
  }
  const message =
    (typeof detail === 'string' && detail) ||
    e?.error ||
    e?.message ||
    'Something went wrong. Please try again.';
  return { fieldError: null, message };
}

// Status label shown on a bubble. Prefer an explicit `message.status` (title-cased); otherwise an
// outbound message with no status is treated as "Pending" (queued, not yet dispatched), inbound as
// "Received". Note: outbound is NOT assumed sent — sending only happens via admin dispatch.
export function messageStatus(message) {
  const raw = message && typeof message === 'object' ? message.status : null;
  if (raw) {
    const s = String(raw).toLowerCase();
    if (s === 'read') return 'Seen';          // client has read it
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  const dir = String(message?.direction || '').toLowerCase();
  if (dir === 'outbound') return 'Pending';
  if (dir === 'inbound') return 'Received';
  return null;
}

// Safe timestamp formatter — accepts ISO or plain date strings; returns '—' when unparseable.
export function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? '—' : format(d, 'dd MMM, HH:mm');
}
