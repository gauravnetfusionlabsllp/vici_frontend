import { useMemo, useRef, useState } from 'react';
import { Send, Save, Loader2, AlertTriangle, MessageCircle } from 'lucide-react';

import { useGetWhatsappMessagesQuery, useSendWhatsappMessageMutation, useUpdateWhatsappMessageMutation, useSendToWhatsappMutation } from '@/services';
import { useToast } from '@/shared/hooks/useToast';
import { SkeletonList } from '@/shared/components/ui';
import {
  buildOutboundMessage,
  renderMessageBody,
  parseApiError,
  fmtTime,
  messageStatus,
  statusTone,
  isPending,
  markMessageSent,
  whatsappSendUrl,
} from '../utils';

const inputCls =
  'w-full rounded-md border border-input bg-input/40 px-3 py-2 text-xs text-foreground ' +
  'placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-smooth resize-none';

// One chat bubble, aligned + tinted by the message direction. In admin mode a pending outbound
// message gets a "Send to WhatsApp" action (opens wa.me, then marks the record sent).
function MessageBubble({ row, adminMode, dispatching, onDispatch }) {
  const msg = row.message || {};
  const outbound = String(msg.direction || '').toLowerCase() === 'outbound';
  const body = renderMessageBody(msg);
  const when = fmtTime(msg.timestamp);
  const status = messageStatus(msg);
  const canDispatch = adminMode && outbound && isPending(msg);

  return (
    <div className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg border px-3 py-2 ${
          outbound
            ? 'bg-primary/15 border-primary/30 rounded-br-sm'
            : 'bg-secondary/40 border-border rounded-bl-sm'
        }`}
      >
        <p className="text-xs text-foreground/90 whitespace-pre-wrap break-words">{body || '—'}</p>
        {msg.media_url && (
          <a
            href={msg.media_url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-[11px] text-primary underline underline-offset-2 break-all"
          >
            {msg.media_url}
          </a>
        )}
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {row.agent_name && <span className="truncate max-w-[120px]">{row.agent_name}</span>}
          {row.agent_name && when && <span>·</span>}
          {when && <span>{when}</span>}
          {status && (
            <span
              className={`ml-auto inline-flex items-center rounded px-1.5 py-px text-[9px] font-medium uppercase tracking-wide ${statusTone(msg.status || (outbound ? 'pending' : ''))}`}
            >
              {status}
            </span>
          )}
        </div>
        {canDispatch && (
          <button
            type="button"
            onClick={() => onDispatch(row)}
            disabled={dispatching}
            className="mt-1.5 inline-flex items-center gap-1 h-6 px-2 rounded-md border border-primary/50 bg-primary text-primary-foreground text-[10px] font-semibold hover:bg-primary/90 transition-smooth active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
            title="Open WhatsApp with this message, then mark it sent"
          >
            {dispatching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            Send to WhatsApp
          </button>
        )}
      </div>
    </div>
  );
}

// Read + compose WhatsApp messages for a single client phone. In the agent modals (default) the
// composer *sends for real* via /send and marks the record sent on success. In the admin console
// (`adminMode`) it only *saves* a pending message, dispatched later per-message via the wa.me button.
// `fill` grows the thread to fill its container height.
export default function WhatsAppThread({ clientPhone, agentName, agentId, fill = false, adminMode = false }) {
  const { error: toastError } = useToast();
  const phone = (clientPhone ?? '').toString().trim();
  const hasPhone = phone.length > 0;

  const {
    data: messages = [],
    isLoading,
    isError,
    error,
  } = useGetWhatsappMessagesQuery(phone, { skip: !hasPhone });

  const [saveMessage] = useSendWhatsappMessageMutation();
  const [updateMessage] = useUpdateWhatsappMessageMutation();
  const [sendToWhatsapp] = useSendToWhatsappMutation();
  const [draft, setDraft] = useState('');
  const [fieldError, setFieldError] = useState(null);
  const [dispatchingId, setDispatchingId] = useState(null);
  const [working, setWorking] = useState(false);
  const scrollRef = useRef(null);

  // API returns newest-first; show chat order (oldest → newest, newest at the bottom).
  const ordered = useMemo(() => [...messages].reverse(), [messages]);

  const handleSave = async () => {
    const body = draft.trim();
    setFieldError(null);
    // Client-side guards to avoid a 422/empty round-trip.
    if (!hasPhone) {
      setFieldError('No phone number on this lead.');
      return;
    }
    if (!body || working) return;

    setWorking(true);
    try {
      // Always store the message first (starts as pending).
      const built = buildOutboundMessage(body);
      const created = await saveMessage({
        agent_name: agentName ?? null,
        agent_id: agentId ?? null,
        client_phone: phone,
        message: built,
      }).unwrap();
      setDraft('');
      // The list refetches via tag invalidation; nudge the scroll to the newest message.
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      });

      // Agent modals: actually deliver via /send, then flip the record to sent on success. On
      // failure the message stays pending (nothing is falsely marked sent).
      if (!adminMode) {
        const id = created?.id ?? created?.data?.id;
        try {
          await sendToWhatsapp({ to: phone, message: body }).unwrap();
          if (id != null) {
            await updateMessage({
              id,
              message: markMessageSent(created?.message ?? built),
              clientPhone: phone,
            }).unwrap();
          }
        } catch (sendErr) {
          toastError(`Saved, but sending failed: ${parseApiError(sendErr).message}`);
        }
      }
    } catch (e) {
      const { fieldError: fe, message } = parseApiError(e);
      if (fe) setFieldError(fe);
      else toastError(`Could not save message: ${message}`);
    } finally {
      setWorking(false);
    }
  };

  // Admin dispatch: open WhatsApp (number + text prefilled), then mark the record sent. The browser
  // can't confirm the admin pressed send in WhatsApp, so we flip to 'sent' right after opening.
  const handleDispatch = async (row) => {
    if (!row?.id || dispatchingId) return;
    const body = renderMessageBody(row.message);
    window.open(whatsappSendUrl(phone, body), '_blank', 'noopener,noreferrer');
    setDispatchingId(row.id);
    try {
      await updateMessage({
        id: row.id,
        message: markMessageSent(row.message),
        clientPhone: phone,
      }).unwrap();
    } catch (e) {
      toastError(`Could not update status: ${parseApiError(e).message}`);
    } finally {
      setDispatchingId(null);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className={fill ? 'flex flex-col h-full gap-2' : 'space-y-2'}>
      {/* Thread */}
      <div
        ref={scrollRef}
        className={`overflow-y-auto scrollbar-thin rounded-lg border border-border/60 bg-secondary/20 p-3 ${
          fill ? 'flex-1 min-h-0' : 'max-h-64'
        }`}
      >
        {!hasPhone ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No phone number on this lead.
          </div>
        ) : isLoading ? (
          <SkeletonList count={4} itemHeight={40} />
        ) : isError ? (
          <div className="flex flex-col items-center gap-1.5 py-6 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-xs">{parseApiError(error).message}</p>
          </div>
        ) : ordered.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-6 text-muted-foreground">
            <MessageCircle className="w-5 h-5" />
            <p className="text-xs">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ordered.map((row) => (
              <MessageBubble
                key={row.id}
                row={row}
                adminMode={adminMode}
                dispatching={dispatchingId === row.id}
                onDispatch={handleDispatch}
              />
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className={`space-y-1 ${fill ? 'shrink-0' : ''}`}>
        <div className="flex items-end gap-2">
          <textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={!hasPhone || working}
            placeholder={
              hasPhone
                ? `Type a message… (Enter to ${adminMode ? 'save' : 'send'}, Shift+Enter for newline)`
                : 'No phone number on this lead'
            }
            className={`${inputCls} disabled:opacity-50`}
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasPhone || working || !draft.trim()}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-primary/50 bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-smooth active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none shrink-0"
            title={adminMode ? 'Save message (queued — dispatch it via the Send to WhatsApp button)' : 'Send this message on WhatsApp'}
          >
            {working ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : adminMode ? (
              <Save className="w-3.5 h-3.5" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {adminMode ? 'Save' : 'Send'}
          </button>
        </div>
        {fieldError && <p className="text-[11px] text-destructive">{fieldError}</p>}
      </div>
    </div>
  );
}
