import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  CheckCheck, Download, FileText, Image as ImageIcon, Loader2, Mic, Video, X,
} from 'lucide-react';

import { selectMaskPii } from '@/features/auth/slices/authSlice';
import { maskPhone } from '@/shared/lib/mask';
import { useGetDoubleTickConversationQuery } from '@/services';

const dayKey = (iso) => (iso ? new Date(iso).toDateString() : '');

const fmtDay = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

const MEDIA_ICON = { image: ImageIcon, audio: Mic, video: Video, document: FileText, sticker: ImageIcon };

// DoubleTick's CDN 403s anonymous requests and a browser can't attach the API key to an
// <img src>, so attachments are fetched through our own proxy.
const proxied = (url) =>
  `${import.meta.env.VITE_BASE_URL}/double-tick/media?url=${encodeURIComponent(url)}`;

/** Attachment rendering: images inline, everything else as a labelled download link. */
function Attachment({ type, url }) {
  const [broken, setBroken] = useState(false);
  if (!url) return null;

  const src = proxied(url);
  const name = decodeURIComponent(url.split('/').pop().split('?')[0]);
  const Icon = MEDIA_ICON[type] ?? Download;

  const link = (label) => (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-muted"
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate max-w-[200px]">{label}</span>
    </a>
  );

  // If the media can't load, fall back to a link rather than a broken-image icon.
  if (broken) return link(name);

  if (type === 'image' || type === 'sticker') {
    return (
      <a href={src} target="_blank" rel="noreferrer" className="block mt-1">
        <img
          src={src}
          alt={type === 'sticker' ? 'Sticker' : 'Shared image'}
          loading="lazy"
          onError={() => setBroken(true)}
          className="max-h-64 rounded-lg border border-border object-contain bg-background"
        />
      </a>
    );
  }

  if (type === 'audio') {
    return <audio controls src={src} onError={() => setBroken(true)} className="mt-1 w-full max-w-[260px]" />;
  }
  if (type === 'video') {
    return <video controls src={src} onError={() => setBroken(true)} className="mt-1 max-h-64 rounded-lg" />;
  }

  return link(name);
}

function Bubble({ m }) {
  const origin = m.message_origin_type;

  // System events are neither side of the conversation — centre them, quietly.
  if (origin === 'SYSTEM') {
    return (
      <div className="flex justify-center my-1.5">
        <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground text-center max-w-[80%]">
          {m.text || 'System event'}
        </span>
      </div>
    );
  }

  const fromCustomer = origin === 'CUSTOMER';
  const hasBody = m.text || m.media_url;

  return (
    <div className={`flex my-1 ${fromCustomer ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[78%] min-w-0 ${fromCustomer ? 'items-start' : 'items-end'} flex flex-col`}>
        {!fromCustomer && m.sender_name && (
          <span className="text-[10px] text-muted-foreground mb-0.5 px-1">{m.sender_name}</span>
        )}

        <div
          className={`rounded-2xl px-3 py-2 border ${
            fromCustomer
              ? 'bg-card border-border rounded-tl-sm'
              : 'bg-primary/10 border-primary/30 rounded-tr-sm'
          }`}
        >
          {m.message_type === 'template' && (
            <span className="mb-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
              Template
            </span>
          )}

          {m.text && (
            <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground">{m.text}</p>
          )}

          <Attachment type={m.message_type} url={m.media_url} />

          {!hasBody && (
            <p className="text-xs italic text-muted-foreground">
              {m.message_type === 'contacts' ? 'Shared a contact card'
                : m.message_type === 'unsupported' ? 'Unsupported message type'
                : `(${m.message_type || 'no content'})`}
            </p>
          )}

          <div className={`mt-1 flex items-center gap-1 text-[10px] text-muted-foreground ${fromCustomer ? '' : 'justify-end'}`}>
            <span>{fmtTime(m.message_time)}</span>
            {!fromCustomer && m.read_count > 0 && <CheckCheck className="w-3 h-3" title="Read" />}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Slide-over showing one contact's whole history — customer on the left, your team on
 * the right, system events down the middle.
 */
export default function ConversationDrawer({ chat, theme, onClose }) {
  const maskPii = useSelector(selectMaskPii);
  const scrollRef = useRef(null);

  const { data, isFetching, isError } = useGetDoubleTickConversationQuery(
    { phone: chat?.phone_number, waba: chat?.waba_number },
    { skip: !chat?.phone_number },
  );

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Open on the newest message, the way a chat app does.
  useEffect(() => {
    if (data && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [data]);

  // Insert a date separator whenever the day changes.
  const grouped = useMemo(() => {
    const out = [];
    let seen = null;
    for (const m of data?.messages ?? []) {
      const k = dayKey(m.message_time);
      if (k && k !== seen) { out.push({ separator: k, at: m.message_time }); seen = k; }
      out.push(m);
    }
    return out;
  }, [data]);

  if (!chat) return null;

  const meta = data?.chat ?? chat;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Close conversation"
      />

      <aside
        className="dt-scope relative flex h-full w-full max-w-[560px] flex-col border-l border-border bg-background shadow-2xl"
        data-theme={theme}
        role="dialog"
        aria-label={`Conversation with ${meta.name || meta.phone_number}`}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">
              {meta.name || 'Unknown contact'}
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
              {maskPii ? maskPhone(meta.phone_number) : meta.phone_number}
              {meta.assigned_user_name ? ` · handled by ${meta.assigned_user_name}` : ' · unassigned'}
              {data ? ` · ${data.message_count} messages` : ''}
            </p>
            {(meta.tag_names ?? []).length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {meta.tag_names.map((t) => (
                  <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Thread */}
        <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto px-4 py-3">
          {isFetching && !data && (
            <div className="flex h-full items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading conversation…
            </div>
          )}

          {isError && (
            <div className="flex h-full items-center justify-center text-xs text-destructive">
              Could not load this conversation.
            </div>
          )}

          {data && data.message_count === 0 && (
            <div className="flex h-full items-center justify-center text-center text-xs italic text-muted-foreground">
              No messages stored for this contact yet.
              <br />Run a sync to pull the history.
            </div>
          )}

          {grouped.map((item, i) =>
            item.separator ? (
              <div key={`sep-${i}`} className="my-3 flex items-center gap-2">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {fmtDay(item.at)}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
            ) : (
              <Bubble key={item.id} m={item} />
            ),
          )}
        </div>

        <footer className="border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
          Read-only history synced from DoubleTick. Left = customer, right = your team.
        </footer>
      </aside>
    </div>
  );
}
