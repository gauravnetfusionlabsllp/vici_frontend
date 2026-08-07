import { useState, useCallback } from 'react';
import { CalendarDays, Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import { SkeletonList } from '@/shared/components/ui';
import {
  useGetWaHolidaysQuery,
  useCreateWaHolidayMutation,
  useDeleteWaHolidayMutation,
} from '@/services';
import { Field, inputClass } from './ui';
import { fmtDate, apiError } from '../utils';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function HolidaysTab() {
  const { success, error } = useToast();
  const { data: holidays = [], isLoading } = useGetWaHolidaysQuery();
  const [createHoliday, { isLoading: isCreating }] = useCreateWaHolidayMutation();
  const [deleteHoliday] = useDeleteWaHolidayMutation();

  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [busyId, setBusyId] = useState(null);

  const add = useCallback(async (e) => {
    e.preventDefault();
    if (!date) return;
    try {
      await createHoliday({ holiday_date: date, name: name.trim() || null }).unwrap();
      success('Holiday saved');
      setDate(''); setName('');
    } catch (err) { error(apiError(err, 'Failed to save holiday')); }
  }, [createHoliday, date, name, success, error]);

  const remove = useCallback(async (h) => {
    try {
      setBusyId(h.id);
      await deleteHoliday(h.id).unwrap();
      success('Holiday removed');
    } catch (err) {
      error(apiError(err, 'Failed to remove holiday'));
    } finally { setBusyId(null); }
  }, [deleteHoliday, success, error]);

  const today = todayISO();
  const upcoming = holidays.filter((h) => h.holiday_date >= today);
  const past = holidays.filter((h) => h.holiday_date < today);

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
        Dates listed here are what templates mean by “holiday”. A template set to
        <span className="text-amber-300"> Holidays only</span> fires on these dates;
        one set to <span className="text-amber-300">Skip holidays</span> stays quiet on them.
      </p>

      <form onSubmit={add}
        className="rounded-xl border border-white/8 bg-slate-950/40 p-4 grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-3 items-end">
        <Field label="Date" required>
          <input type="date" className={inputClass} value={date}
            onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Label" hint="Optional — e.g. Diwali, Independence Day.">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Holiday name" />
        </Field>
        <button type="submit" disabled={!date || isCreating}
          className="flex items-center justify-center gap-2 rounded-lg border border-amber-600/40
            bg-amber-600/20 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-600/30
            disabled:opacity-50 transition h-[38px]">
          {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add
        </button>
      </form>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : holidays.length === 0 ? (
        <div className="py-12 flex flex-col items-center gap-3 animate-fade-in-up">
          <div className="h-12 w-12 rounded-xl bg-slate-800/60 border border-white/10 grid place-items-center">
            <CalendarDays className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-sm text-slate-400">No holidays configured</p>
          <p className="text-xs text-slate-600">Add dates above to drive holiday-specific templates.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <HolidayGroup title="Upcoming" rows={upcoming} onRemove={remove} busyId={busyId} />
          <HolidayGroup title="Past" rows={past} onRemove={remove} busyId={busyId} muted />
        </div>
      )}
    </div>
  );
}

function HolidayGroup({ title, rows, onRemove, busyId, muted }) {
  if (!rows.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-widest text-slate-500">{title} · {rows.length}</p>
      <div className="rounded-xl border border-white/8 bg-slate-950/40 divide-y divide-white/6">
        {rows.map((h) => (
          <div key={h.id}
            className={`flex items-center justify-between gap-3 px-4 py-2.5 ${muted ? 'opacity-55' : ''}`}>
            <div className="min-w-0 flex items-center gap-3">
              <CalendarDays className="w-4 h-4 text-amber-400/70 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-200 truncate">{fmtDate(h.holiday_date)}</p>
                {h.name && <p className="text-[11px] text-slate-500 truncate">{h.name}</p>}
              </div>
            </div>
            <button onClick={() => onRemove(h)} disabled={busyId === h.id} title="Remove"
              className="h-7 w-7 grid place-items-center rounded-lg border border-white/10 bg-white/5
                text-slate-500 hover:text-rose-300 hover:border-rose-500/30 transition active:scale-90
                disabled:opacity-50">
              {busyId === h.id
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
