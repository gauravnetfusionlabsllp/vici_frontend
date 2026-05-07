import { useState } from 'react';
import { Mail, Paperclip } from 'lucide-react';
import TemplatesTab from './components/TemplatesTab';
import AttachmentsTab from './components/AttachmentsTab';

const TABS = [
  { key: 'templates',   label: 'Templates',   icon: Mail },
  { key: 'attachments', label: 'Attachments', icon: Paperclip },
];

export default function EmailTemplatesPage() {
  const [tab, setTab] = useState('templates');

  return (
    <div className="min-h-screen p-4 md:p-6 bg-[hsl(231_58%_6%)] text-white">
      <div className="mx-auto max-w-[1440px] space-y-5 stagger-children">

        {/* Page header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10
          bg-gradient-to-b from-slate-900/70 to-slate-950/80
          shadow-[0_30px_120px_rgba(0,0,0,0.55)] px-5 py-5 transition-smooth">
          <div className="pointer-events-none absolute inset-0 opacity-60
            bg-[radial-gradient(700px_circle_at_0%_0%,rgba(56,189,248,0.14),transparent_55%),
               radial-gradient(600px_circle_at_100%_100%,rgba(168,85,247,0.10),transparent_55%)]" />
          <div className="relative flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl border border-sky-400/20 bg-sky-500/10 grid place-items-center shrink-0">
              <Mail className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-100 leading-none">Email Management</h1>
              <p className="text-xs text-slate-400 mt-1">Manage email templates and attachments</p>
            </div>
          </div>
        </div>

        {/* Main card */}
        <div className="border border-border rounded-xl bg-card/60 p-4 md:p-5 transition-smooth">
          <div className="flex gap-2 mb-5 border-b border-white/8 pb-4">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-smooth active:scale-[0.97]
                  ${tab === key
                    ? 'border-sky-500/40 bg-sky-500/15 text-sky-200 shadow-[0_4px_14px_-4px_rgba(56,189,248,0.4)]'
                    : 'border-white/8 bg-white/[0.03] text-slate-400 hover:text-slate-200 hover:bg-white/6'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div key={tab} className="animate-fade-in">
            {tab === 'templates'   && <TemplatesTab />}
            {tab === 'attachments' && <AttachmentsTab />}
          </div>
        </div>

      </div>
    </div>
  );
}
