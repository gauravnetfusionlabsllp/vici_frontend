import { Clock, CalendarDays, Filter, Pencil, Trash2, Send, GripVertical } from 'lucide-react';
import { describeDays, describeWindow, describeHoliday, describeFilter } from '../utils';

export default function TemplateCard({ tpl, onEdit, onDelete, onTest }) {
  const holiday = describeHoliday(tpl.holiday_mode);

  return (
    <div className={`group relative rounded-xl border p-4 transition-smooth
      ${tpl.is_active
        ? 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
        : 'border-white/5 bg-white/[0.01] opacity-60 hover:opacity-90'}`}>

      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex items-start gap-2">
          <span className="mt-0.5 flex items-center gap-1 rounded-md border border-white/10 bg-slate-900/60
            px-1.5 py-0.5 text-[10px] font-mono text-slate-500 shrink-0" title="Priority — lower runs first">
            <GripVertical className="w-3 h-3" />{tpl.priority}
          </span>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-100 truncate">{tpl.name}</h4>
            <span className={`mt-1 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium
              ${tpl.is_active
                ? 'border-emerald-500/25 bg-emerald-500/12 text-emerald-300'
                : 'border-slate-500/25 bg-slate-500/12 text-slate-400'}`}>
              {tpl.is_active ? 'Active' : 'Paused'}
            </span>
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
          <IconBtn title="Test send" onClick={() => onTest(tpl)}><Send className="w-3.5 h-3.5" /></IconBtn>
          <IconBtn title="Edit" onClick={() => onEdit(tpl)}><Pencil className="w-3.5 h-3.5" /></IconBtn>
          <IconBtn title="Delete" danger onClick={() => onDelete(tpl)}><Trash2 className="w-3.5 h-3.5" /></IconBtn>
        </div>
      </div>

      {/* message preview */}
      <p className="mt-3 text-xs text-slate-400 leading-relaxed line-clamp-3 whitespace-pre-wrap
        rounded-lg border border-white/6 bg-slate-950/40 p-2.5">
        {tpl.body}
      </p>

      {/* schedule + filters */}
      <div className="mt-3 space-y-1.5 text-[11px] text-slate-500">
        <Row icon={CalendarDays} tone="text-violet-400">
          {describeDays(tpl.days_of_week)}
          {holiday && <span className="ml-1.5 text-amber-400/80">· {holiday}</span>}
        </Row>
        <Row icon={Clock} tone="text-sky-400">
          {describeWindow(tpl.start_time, tpl.end_time)}
        </Row>
        <Row icon={Filter} tone="text-emerald-400">
          {describeFilter(tpl.sources, 'source')}
          <span className="mx-1 text-slate-700">|</span>
          {describeFilter(tpl.campaigns, 'campaign')}
        </Row>
      </div>
    </div>
  );
}

function Row({ icon: Icon, tone, children }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-3.5 h-3.5 shrink-0 ${tone}`} />
      <span className="truncate">{children}</span>
    </div>
  );
}

function IconBtn({ title, onClick, danger, children }) {
  return (
    <button title={title} onClick={onClick}
      className={`h-7 w-7 grid place-items-center rounded-lg border border-white/10 bg-white/5
        transition-smooth active:scale-90
        ${danger ? 'text-slate-500 hover:text-rose-300 hover:border-rose-500/30'
                 : 'text-slate-500 hover:text-slate-100 hover:bg-white/10'}`}>
      {children}
    </button>
  );
}
