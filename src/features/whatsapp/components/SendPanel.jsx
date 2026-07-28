import { useState } from 'react';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { useSendWhatsappMessageMutation } from '@/services';
import { useToast } from '@/shared/hooks/useToast';
import { cn } from '@/shared/lib/utils';

const inputCls =
  'w-full rounded-md bg-input border border-border px-3 py-2 text-sm text-foreground ' +
  'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-smooth';

export default function SendPanel() {
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('');
  const [showMedia, setShowMedia] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mimetype, setMimetype] = useState('');
  const [filename, setFilename] = useState('');
  const [result, setResult] = useState(null);

  const { success, error: toastError } = useToast();
  const [sendMessage, { isLoading }] = useSendWhatsappMessageMutation();

  const onSend = async () => {
    if (!to.trim()) return toastError('Recipient number is required');
    if (!message.trim() && !mediaUrl.trim()) return toastError('Enter a message or a media URL');

    const body = { to: to.trim(), message };
    if (showMedia && mediaUrl.trim()) {
      body.media_url = mediaUrl.trim();
      if (mimetype.trim()) body.mimetype = mimetype.trim();
      if (filename.trim()) body.filename = filename.trim();
    }

    try {
      const res = await sendMessage(body).unwrap();
      setResult(res);
      success('Message sent ✓');
    } catch (e) {
      const detail = e?.data?.detail;
      const msg =
        detail?.wa_error?.message || (typeof detail === 'string' ? detail : null) || 'Send failed';
      toastError(msg);
      setResult(e?.data ?? { error: String(e) });
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Compose */}
      <div className="rounded-xl border border-border bg-card/60 p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Send a WhatsApp message</h3>

        <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
          To (phone or chatId)
        </label>
        <input
          className={inputCls}
          placeholder="918452015261  or  918452015261@c.us"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />

        <label className="mb-1 mt-4 block text-xs uppercase tracking-wider text-muted-foreground">
          Message {showMedia && <span className="text-muted-foreground/70">(used as caption)</span>}
        </label>
        <textarea
          className={cn(inputCls, 'min-h-[110px] resize-y')}
          placeholder="Type your message…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          type="button"
          onClick={() => setShowMedia((v) => !v)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-smooth"
        >
          <Paperclip className="h-3.5 w-3.5" />
          {showMedia ? 'Remove attachment' : 'Attach media (image / PDF / video…)'}
        </button>

        {showMedia && (
          <div className="mt-3 grid gap-3 rounded-lg border border-border bg-background/40 p-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Media URL (public)</label>
              <input
                className={inputCls}
                placeholder="https://example.com/invoice.pdf"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">MIME type</label>
                <input
                  className={inputCls}
                  placeholder="application/pdf"
                  value={mimetype}
                  onChange={(e) => setMimetype(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Filename</label>
                <input
                  className={inputCls}
                  placeholder="invoice.pdf"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Kind (image/video/audio/document) is auto-detected from the MIME type.
            </p>
          </div>
        )}

        <button
          onClick={onSend}
          disabled={isLoading}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-smooth disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send
        </button>
      </div>

      {/* Result */}
      <div className="rounded-xl border border-border bg-card/60 p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Result</h3>
        {result ? (
          <pre className="max-h-[420px] overflow-auto rounded-lg bg-background/60 p-3 text-xs text-foreground font-mono">
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">The API response will appear here.</p>
        )}
      </div>
    </div>
  );
}
