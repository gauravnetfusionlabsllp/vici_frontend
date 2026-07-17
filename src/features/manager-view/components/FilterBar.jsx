import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Megaphone, FileText, Image, Layers, Radio, User, PhoneCall, Filter, X, Search } from 'lucide-react';

import MultiSelectDropdown from './MultiSelectDropdown';
import { useMvTheme } from '../theme';

function toYMD(d) {
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fromYMD(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

const dpCls =
  'w-full rounded-md border border-input bg-input/40 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/60 transition-smooth';
const selectCls =
  'w-full min-w-[9rem] rounded-md border border-input bg-input/40 px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/60 transition-smooth';

/**
 * Sticky filter bar. `draft` is the working filter object; SET/select/date edits are committed on
 * Apply, while phone edits are lifted live (debounced by the parent).
 */
export default function FilterBar({ draft, setDraft, options, optionsLoading, onApply, onClear }) {
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const today = new Date();
  const theme = useMvTheme();
  const popperCls = `z-[60] ${theme === 'light' ? 'light-datepicker' : 'dark-datepicker'}`;

  return (
    <div className="sticky top-0 z-30 rounded-xl border border-border bg-card/80 backdrop-blur-md px-3 py-3 transition-smooth">
      <div className="flex flex-wrap items-end gap-2.5">
        {/* Date range */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest">From</label>
          <DatePicker
            selected={fromYMD(draft.sd)}
            onChange={(d) => set('sd', toYMD(d))}
            selectsStart
            startDate={fromYMD(draft.sd)}
            endDate={fromYMD(draft.ed)}
            maxDate={fromYMD(draft.ed) || today}
            dateFormat="dd MMM yyyy"
            className={dpCls}
            popperClassName={popperCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest">To</label>
          <DatePicker
            selected={fromYMD(draft.ed)}
            onChange={(d) => set('ed', toYMD(d))}
            selectsEnd
            startDate={fromYMD(draft.sd)}
            endDate={fromYMD(draft.ed)}
            minDate={fromYMD(draft.sd)}
            maxDate={today}
            dateFormat="dd MMM yyyy"
            className={dpCls}
            popperClassName={popperCls}
          />
        </div>

        {/* SET multi-selects */}
        <MultiSelectDropdown
          label="Campaign" icon={Megaphone} options={options.campaign_name}
          selected={draft.campaign_name} onChange={(v) => set('campaign_name', v)} loading={optionsLoading}
        />
        <MultiSelectDropdown
          label="Form" icon={FileText} options={options.form_name}
          selected={draft.form_name} onChange={(v) => set('form_name', v)} loading={optionsLoading}
        />
        <MultiSelectDropdown
          label="Ad" icon={Image} options={options.ad_name}
          selected={draft.ad_name} onChange={(v) => set('ad_name', v)} loading={optionsLoading}
        />
        <MultiSelectDropdown
          label="Ad Set" icon={Layers} options={options.adset_name}
          selected={draft.adset_name} onChange={(v) => set('adset_name', v)} loading={optionsLoading}
        />
        <MultiSelectDropdown
          label="Source" icon={Radio} options={options.source}
          selected={draft.source} onChange={(v) => set('source', v)} loading={optionsLoading}
        />

        {/* Single-selects */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <User className="w-3 h-3" /> Agent
          </label>
          <select value={draft.agent_user} onChange={(e) => set('agent_user', e.target.value)} className={selectCls}>
            <option value="">All agents</option>
            {options.agent_user.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Filter className="w-3 h-3" /> Call Outcome
          </label>
          <select value={draft.call_outcome} onChange={(e) => set('call_outcome', e.target.value)} className={selectCls}>
            <option value="">All outcomes</option>
            {options.call_outcome.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Phone (partial, debounced live by parent) */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <PhoneCall className="w-3 h-3" /> Phone
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <input
              type="text"
              value={draft.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="Partial…"
              className="w-40 rounded-md border border-input bg-input/40 pl-7 pr-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-smooth"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onApply}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-smooth active:scale-95"
          >
            <Filter className="w-3.5 h-3.5" /> Apply
          </button>
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary text-xs transition-smooth active:scale-95"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>
    </div>
  );
}
