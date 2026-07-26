import { useState } from 'react';
import { Search, Plus, MessageCircle } from 'lucide-react';

const inputCls =
  'w-full rounded-md border border-input bg-input/40 px-3 py-1.5 text-xs text-foreground ' +
  'placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-smooth';

// Left rail of the WhatsApp console: a "new chat" box, a search filter, and the list of
// conversations (one row per client phone). Presentational — all state lives in the page.
export default function ConversationList({ conversations, selected, onSelect, search, onSearch, onNewChat }) {
  const [newPhone, setNewPhone] = useState('');

  const startNewChat = () => {
    const phone = newPhone.trim();
    if (!phone) return;
    onNewChat(phone);
    setNewPhone('');
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* New chat + search */}
      <div className="p-2 space-y-2 border-b border-border shrink-0">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            inputMode="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); startNewChat(); } }}
            placeholder="New chat: phone number…"
            className={inputCls}
          />
          <button
            type="button"
            onClick={startNewChat}
            disabled={!newPhone.trim()}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-primary/50 bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth disabled:opacity-50 disabled:pointer-events-none shrink-0"
            title="Start new chat"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search number…"
            className={`${inputCls} pl-8`}
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-10 text-muted-foreground">
            <MessageCircle className="w-5 h-5" />
            <p className="text-xs">No conversations</p>
          </div>
        ) : (
          conversations.map((c) => {
            const active = c.phone === selected;
            return (
              <button
                key={c.phone}
                type="button"
                onClick={() => onSelect(c.phone)}
                className={`w-full text-left px-3 py-2 border-b border-border/50 transition-smooth ${
                  active ? 'bg-primary/10' : 'hover:bg-secondary/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-foreground truncate">{c.phone}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{c.count}</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{c.lastBody || '—'}</p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
