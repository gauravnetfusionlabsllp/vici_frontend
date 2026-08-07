import { useState } from 'react';
import { Bot, MessageSquare, CalendarDays, Activity } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import {
  useGetWaAutomationSettingsQuery,
  useUpdateWaAutomationSettingsMutation,
} from '@/services';
import { Toggle } from './components/ui';
import TemplatesTab from './components/TemplatesTab';
import HolidaysTab from './components/HolidaysTab';
import LogsTab from './components/LogsTab';
import { apiError } from './utils';

const TABS = [
  { key: 'templates', label: 'Templates', icon: MessageSquare },
  { key: 'holidays',  label: 'Holidays',  icon: CalendarDays },
  { key: 'logs',      label: 'Activity',  icon: Activity },
];

export default function WhatsAppAutomationPage() {
  const [tab, setTab] = useState('templates');
  const { success, error } = useToast();

  const { data: settings } = useGetWaAutomationSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateWaAutomationSettingsMutation();
  const enabled = settings?.enabled ?? true;

  const toggle = async (next) => {
    try {
      await updateSettings({ enabled: next }).unwrap();
      success(next ? 'Automation enabled' : 'Automation paused');
    } catch (e) { error(apiError(e, 'Could not update the setting')); }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-[hsl(231_58%_6%)] text-white">
      <div className="mx-auto max-w-[1440px] space-y-5 stagger-children">

        {/* Page header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10
          bg-gradient-to-b from-slate-900/70 to-slate-950/80
          shadow-[0_30px_120px_rgba(0,0,0,0.55)] px-5 py-5 transition-smooth">
          <div className="pointer-events-none absolute inset-0 opacity-60
            bg-[radial-gradient(700px_circle_at_0%_0%,rgba(34,197,94,0.14),transparent_55%),
               radial-gradient(600px_circle_at_100%_100%,rgba(168,85,247,0.10),transparent_55%)]" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl border border-emerald-400/20 bg-emerald-500/10 grid place-items-center shrink-0">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-100 leading-none">WhatsApp Automation</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Auto-reply to every new Meta lead, by time of day, weekday, holiday, source and campaign
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-smooth
              ${enabled ? 'border-emerald-500/25 bg-emerald-500/8' : 'border-white/10 bg-white/[0.03]'}`}>
              <div className="text-right">
                <p className={`text-xs font-semibold ${enabled ? 'text-emerald-300' : 'text-slate-400'}`}>
                  {enabled ? 'Running' : 'Paused'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {enabled ? 'New leads get a message' : 'No messages are sent'}
                </p>
              </div>
              <Toggle checked={enabled} onChange={toggle} disabled={isSaving} />
            </div>
          </div>
        </div>

        {/* Main card */}
        <div className="border border-border rounded-xl bg-card/60 p-4 md:p-5 transition-smooth">
          <div className="flex gap-2 mb-5 border-b border-white/8 pb-4">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium
                  transition-smooth active:scale-[0.97]
                  ${tab === key
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200 shadow-[0_4px_14px_-4px_rgba(34,197,94,0.4)]'
                    : 'border-white/8 bg-white/[0.03] text-slate-400 hover:text-slate-200 hover:bg-white/6'}`}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div key={tab} className="animate-fade-in">
            {tab === 'templates' && <TemplatesTab />}
            {tab === 'holidays'  && <HolidaysTab />}
            {tab === 'logs'      && <LogsTab />}
          </div>
        </div>

      </div>
    </div>
  );
}
