import { useState } from 'react';
import { MessageCircle, Send, Server, Terminal } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import SendPanel from './components/SendPanel';
import SessionsPanel from './components/SessionsPanel';
import ApiConsole from './components/ApiConsole';

const TABS = [
  { key: 'send', label: 'Send', icon: Send },
  { key: 'sessions', label: 'Sessions', icon: Server },
  { key: 'console', label: 'API Console', icon: Terminal },
];

export default function WhatsAppPage() {
  const [tab, setTab] = useState('send');

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">WhatsApp</h1>
          <p className="text-xs text-muted-foreground">
            Send messages and drive the open-wa API through the secure backend proxy.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 inline-flex rounded-lg border border-border bg-card/60 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-smooth',
              tab === key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Panels */}
      {tab === 'send' && <SendPanel />}
      {tab === 'sessions' && <SessionsPanel />}
      {tab === 'console' && <ApiConsole />}
    </div>
  );
}
