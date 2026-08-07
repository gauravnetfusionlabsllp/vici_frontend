import { useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarDays } from 'lucide-react';

import { useDtTheme } from '../theme';
import { fmtDate, fromYMD, presetRanges, toYMD } from '../dateRange';

const TODAY_YMD = () => toYMD(new Date());

/**
 * One filter row for the whole page: quick presets, a two-month calendar for picking a
 * day or a span, and typed From/To boxes inside the calendar for exact entry.
 * Everything downstream re-reads from the same {sd, ed}.
 */
export default function DateRangeFilter({ sd, ed, onChange, right }) {
  const theme = useDtTheme();
  const today = useMemo(() => new Date(), []);
  const presets = useMemo(() => presetRanges(), []);

  const [open, setOpen] = useState(false);
  // Half-finished range held locally. Committing on the first click would make the
  // picker think the range was complete, so the second click would start over —
  // which is exactly why an end date couldn't be chosen.
  const [draft, setDraft] = useState(null);

  const start = draft ? draft[0] : fromYMD(sd);
  const end = draft ? draft[1] : fromYMD(ed);
  const dayCount = !draft && start && end ? Math.round((end - start) / 86400000) + 1 : 0;
  const activePreset = presets.find((p) => p.sd === sd && p.ed === ed)?.label;

  const commit = (s, e) => {
    // Tolerate a reversed pair so typing "to" before "from" still works.
    const [a, b] = s <= e ? [s, e] : [e, s];
    setDraft(null);
    onChange({ sd: a, ed: b });
  };

  const pick = ([s, e]) => {
    if (s && e) { commit(toYMD(s), toYMD(e)); setOpen(false); return; }
    setDraft([s, null]);              // first click — wait for the second
  };

  const typed = (which) => (e) => {
    const v = e.target.value;
    if (!v) return;
    const val = v > TODAY_YMD() ? TODAY_YMD() : v;
    // Typing a From past the current To drags To along (and vice versa) rather than
    // swapping the two — swapping would silently move the field you just set.
    if (which === 'sd') commit(val, ed && ed < val ? val : ed);
    else commit(sd && sd > val ? val : sd, val);
  };

  const dateBox =
    'h-7 rounded-md border border-border bg-background px-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring';

  return (
    <div className="mb-3 rounded-xl border border-border bg-card px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Activity period
        </span>

        {/* Calendar range picker */}
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-2 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <DatePicker
            selectsRange
            startDate={start}
            endDate={end}
            maxDate={today}
            monthsShown={2}
            shouldCloseOnSelect={false}
            dateFormat="dd MMM yyyy"
            open={open}
            onInputClick={() => setOpen((o) => !o)}
            onClickOutside={() => { setOpen(false); setDraft(null); }}
            onChange={pick}
            customInput={
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background pl-7 pr-2.5 text-xs text-foreground hover:bg-muted"
              >
                {sd && ed ? `${fmtDate(sd)} — ${fmtDate(ed)}` : 'Pick dates'}
              </button>
            }
            popperClassName={`z-[60] dt-datepicker ${theme === 'light' ? 'light-datepicker' : 'dark-datepicker'}`}
            popperPlacement="bottom-start"
          >
            {/* Typed entry, for when clicking through months is slower than typing. */}
            <div className="flex flex-wrap items-end gap-2 border-t border-border px-2 pt-2">
              <label className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">From</span>
                <input type="date" value={sd ?? ''} max={ed ?? TODAY_YMD()}
                       onChange={typed('sd')} className={dateBox} />
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">To</span>
                <input type="date" value={ed ?? ''} min={sd ?? undefined} max={TODAY_YMD()}
                       onChange={typed('ed')} className={dateBox} />
              </label>
              <button
                type="button"
                onClick={() => { setDraft(null); setOpen(false); }}
                className="ml-auto h-7 rounded-md bg-primary px-2.5 text-[11px] text-primary-foreground hover:opacity-90"
              >
                Done
              </button>
            </div>
          </DatePicker>
          {draft && (
            <span className="absolute left-0 top-full mt-1 whitespace-nowrap text-[10px] text-muted-foreground">
              Now pick the end date
            </span>
          )}
        </div>

        {/* Quick jumps */}
        <div className="flex flex-wrap gap-1">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => { setDraft(null); setOpen(false); onChange({ sd: p.sd, ed: p.ed }); }}
              aria-pressed={activePreset === p.label}
              className={`rounded-md px-2.5 py-1 text-[11px] transition-colors ${
                activePreset === p.label
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Divider keeps this from reading as one more preset button. */}
        <span className="hidden sm:inline h-4 w-px bg-border" aria-hidden="true" />
        <span className="text-[11px] text-muted-foreground">
          Showing <span className="tabular-nums">{dayCount}</span> {dayCount === 1 ? 'day' : 'days'}
        </span>

        {right && <span className="ml-auto">{right}</span>}
      </div>
    </div>
  );
}
