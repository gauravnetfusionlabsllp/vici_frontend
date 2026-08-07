import { useMemo, useState } from 'react';
import { Loader2, Clock, Filter, MessageSquare } from 'lucide-react';
import { Field, MultiSelect, Toggle, inputClass } from './ui';
import { DAYS, WEEKDAYS, WEEKEND, HOLIDAY_MODES } from '../utils';

const EMPTY = {
  name: '', body: '', is_active: true, priority: 100,
  start_time: '', end_time: '', days_of_week: [],
  holiday_mode: 'ignore', sources: [], campaigns: [],
};

const PRESETS = [
  { label: 'Mon–Fri 9am–6pm', apply: { days_of_week: WEEKDAYS, start_time: '09:00', end_time: '18:00', holiday_mode: 'exclude' } },
  { label: 'Mon–Fri 6pm–9am', apply: { days_of_week: WEEKDAYS, start_time: '18:00', end_time: '09:00', holiday_mode: 'exclude' } },
  { label: 'Weekend',          apply: { days_of_week: WEEKEND, start_time: '', end_time: '', holiday_mode: 'ignore' } },
  { label: 'Holidays only',    apply: { days_of_week: [], start_time: '', end_time: '', holiday_mode: 'only' } },
];

export default function TemplateForm({ initial, options, placeholders = [], onSave, onCancel, isSaving }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(initial || {}) }));
  const [touched, setTouched] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const errors = useMemo(() => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.body.trim()) e.body = 'Message is required';
    // One bound without the other is ambiguous — the server would read it as an
    // open-ended window, which is almost never what the admin meant.
    if (!!form.start_time !== !!form.end_time) e.time = 'Set both a start and an end time, or leave both empty for all day';
    return e;
  }, [form]);

  const submit = (ev) => {
    ev.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length) return;
    onSave({
      ...form,
      name: form.name.trim(),
      body: form.body.trim(),
      priority: Number(form.priority) || 0,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
    });
  };

  const toggleDay = (d) =>
    set({ days_of_week: form.days_of_week.includes(d)
      ? form.days_of_week.filter((x) => x !== d)
      : [...form.days_of_week, d] });

  const insertToken = (token) => set({ body: `${form.body}{{${token}}}` });

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* ── Identity ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <Field label="Template name" required>
            <input className={inputClass} value={form.name} autoFocus
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Business hours greeting" />
            {touched && errors.name && <p className="text-[11px] text-rose-400 mt-1">{errors.name}</p>}
          </Field>
        </div>
        <Field label="Priority" hint="Lower runs first. The first match wins.">
          <input type="number" min={0} max={9999} className={inputClass} value={form.priority}
            onChange={(e) => set({ priority: e.target.value })} />
        </Field>
      </div>

      {/* ── Message ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/8 bg-slate-950/40 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <MessageSquare className="w-3.5 h-3.5 text-sky-400" /> Message
        </div>
        <textarea rows={5} value={form.body} onChange={(e) => set({ body: e.target.value })}
          className={`${inputClass} resize-y leading-relaxed`}
          placeholder="Hi {{first_name}}, thanks for reaching out! Our team will call you shortly." />
        {touched && errors.body && <p className="text-[11px] text-rose-400">{errors.body}</p>}
        {placeholders.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 mr-1">Insert:</span>
            {placeholders.map((p) => (
              <button key={p} type="button" onClick={() => insertToken(p)}
                className="rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[11px]
                  font-mono text-slate-400 hover:text-sky-200 hover:border-sky-500/30 transition">
                {`{{${p}}}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Schedule ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/8 bg-slate-950/40 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            <Clock className="w-3.5 h-3.5 text-violet-400" /> Schedule
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button key={p.label} type="button" onClick={() => set(p.apply)}
                className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px]
                  text-slate-400 hover:text-violet-200 hover:border-violet-500/30 transition">
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <Field label="Days" hint="None selected = every day.">
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map((d) => (
              <button key={d.value} type="button" onClick={() => toggleDay(d.value)}
                className={`w-12 rounded-lg border px-2 py-1.5 text-xs font-medium transition
                  ${form.days_of_week.includes(d.value)
                    ? 'border-violet-500/40 bg-violet-500/15 text-violet-200'
                    : 'border-white/8 bg-white/[0.03] text-slate-500 hover:text-slate-300'}`}>
                {d.short}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="From" hint="Leave both empty to run all day.">
            <input type="time" className={inputClass} value={form.start_time || ''}
              onChange={(e) => set({ start_time: e.target.value })} />
          </Field>
          <Field label="Until" hint="An end earlier than the start wraps past midnight.">
            <input type="time" className={inputClass} value={form.end_time || ''}
              onChange={(e) => set({ end_time: e.target.value })} />
          </Field>
        </div>
        {touched && errors.time && <p className="text-[11px] text-rose-400">{errors.time}</p>}

        <Field label="Holidays">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {HOLIDAY_MODES.map((m) => (
              <button key={m.value} type="button" onClick={() => set({ holiday_mode: m.value })}
                title={m.hint}
                className={`rounded-lg border px-3 py-2 text-left text-xs transition
                  ${form.holiday_mode === m.value
                    ? 'border-amber-500/40 bg-amber-500/12 text-amber-200'
                    : 'border-white/8 bg-white/[0.03] text-slate-400 hover:text-slate-200'}`}>
                <span className="block font-medium">{m.label}</span>
                <span className="block text-[10px] opacity-70 mt-0.5 leading-snug">{m.hint}</span>
              </button>
            ))}
          </div>
        </Field>
      </div>

      {/* ── Filters ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/8 bg-slate-950/40 p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <Filter className="w-3.5 h-3.5 text-emerald-400" /> Lead filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Sources" hint="Empty = every source.">
            <MultiSelect options={options?.sources ?? []} value={form.sources}
              onChange={(v) => set({ sources: v })} placeholder="Any source" />
          </Field>
          <Field label="Campaigns" hint="Empty = every campaign.">
            <MultiSelect options={options?.campaigns ?? []} value={form.campaigns}
              onChange={(v) => set({ campaigns: v })} placeholder="Any campaign" />
          </Field>
        </div>
      </div>

      {/* ── Actions ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <Toggle checked={form.is_active} onChange={(v) => set({ is_active: v })} label="Active" />
        <div className="flex gap-2">
          <button type="button" onClick={onCancel}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300
              hover:bg-white/10 transition">Cancel</button>
          <button type="submit" disabled={isSaving}
            className="flex items-center gap-2 rounded-lg border border-sky-600/40 bg-sky-600/25 px-4 py-2
              text-sm font-semibold text-sky-100 hover:bg-sky-600/35 disabled:opacity-50 transition">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {initial ? 'Save changes' : 'Create template'}
          </button>
        </div>
      </div>
    </form>
  );
}
