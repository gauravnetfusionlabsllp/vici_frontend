import { useState, useEffect, useMemo, useRef, Fragment } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  X,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  CalendarRange,
  Calendar,
  Filter as FilterIcon,
  Target,
  Tag,
  Layers,
  FileText,
  ShieldCheck,
  Infinity,
  Clock3,
  Pause,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import {
  useCreateCampaignLeadMutation,
  useLeadFiltersQuery,
  useGetCampaignsQuery,
} from '@/services';
import { fmtDate } from '../utils';

const STEPS = [
  { n: 1, label: 'Date Range',  icon: Calendar,   desc: 'When the rule is active' },
  { n: 2, label: 'Filters',     icon: FilterIcon, desc: 'Which leads to match' },
  { n: 3, label: 'Destination', icon: Target,     desc: 'Where to route them' },
];

const EMPTY = {
  rule_name: '',
  sources: [],
  campaign_names: [],
  form_names: [],
  destination_campaign: '',
  startDate: '',
  endDate: '',
  isActive: true,
};

const ymdToDate = (s) => {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const dateToYMD = (d) => {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

function StepRail({ current }) {
  return (
    <div className="px-6 py-4 border-b border-white/10 bg-slate-950/40">
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = current === s.n;
          const isDone = current > s.n;
          return (
            <Fragment key={s.n}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`relative h-9 w-9 rounded-xl grid place-items-center text-xs font-bold border transition shrink-0
                  ${isDone   ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : isActive ? 'bg-sky-500/20 border-sky-500/40 text-sky-200 ring-2 ring-sky-500/15 shadow-[0_0_24px_rgba(56,189,248,0.25)]'
                             : 'bg-slate-800/60 border-slate-700/60 text-slate-500'}`}>
                  {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="hidden sm:block min-w-0">
                  <div className={`text-[9px] uppercase tracking-widest font-semibold leading-none mb-1
                    ${isActive ? 'text-sky-400' : isDone ? 'text-emerald-400' : 'text-slate-600'}`}>
                    Step {s.n}
                  </div>
                  <div className={`text-xs font-semibold truncate
                    ${isActive ? 'text-slate-100' : isDone ? 'text-slate-300' : 'text-slate-500'}`}>
                    {s.label}
                  </div>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-3 transition
                  ${isDone ? 'bg-emerald-500/40' : 'bg-slate-700/40'}`} />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function MultiSelectDropdown({
  label,
  icon: Icon,
  hint,
  options,
  selected,
  onChange,
  loading,
  disabled,
  disabledHint,
  required,
  placeholder = 'Select one or more…',
  emptyLabel = 'No options for this date range',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);

  const isInactive = loading || disabled;

  useEffect(() => {
    if (disabled && open) setOpen(false);
  }, [disabled, open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => { if (!open) setQuery(''); }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter((o) => o.label.toLowerCase().includes(q))
    : options;

  const toggle = (v) => {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };
  const selectAllFiltered = () => {
    const merged = Array.from(new Set([...selected, ...filtered.map((o) => o.value)]));
    onChange(merged);
  };
  const clearAll = () => onChange([]);

  return (
    <div className="flex flex-col gap-1.5" ref={wrapRef}>
      <label className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}{required && <span className="text-rose-400">*</span>}
      </label>

      <div className="relative">
        <button
          type="button"
          disabled={isInactive}
          onClick={() => setOpen((o) => !o)}
          className={`w-full flex items-center justify-between gap-2 rounded-lg border bg-slate-900/80 px-3 py-2.5 text-sm text-left transition
            disabled:opacity-40 disabled:cursor-not-allowed
            ${open ? 'border-sky-500/50 ring-2 ring-sky-500/20' : 'border-slate-700 hover:border-slate-600'}`}
        >
          <span className="truncate">
            {loading
              ? <span className="text-slate-500 inline-flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</span>
              : disabled
                ? <span className="text-slate-500 italic">{disabledHint || placeholder}</span>
                : selected.length === 0
                  ? <span className="text-slate-500">{placeholder}</span>
                  : <span className="text-slate-100">
                      <span className="font-semibold text-sky-300">{selected.length}</span>
                      <span className="text-slate-400"> of {options.length} selected</span>
                    </span>
            }
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition shrink-0 ${open ? 'rotate-180 text-sky-400' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-30 left-0 right-0 mt-2 rounded-xl border border-white/10 bg-slate-900/98 backdrop-blur-xl
            shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden animate-[fadeIn_0.12s_ease-out]">
            {options.length > 6 && (
              <div className="px-3 py-2 border-b border-white/5 bg-slate-950/40">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200
                    placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
                />
              </div>
            )}
            <div className="max-h-56 overflow-y-auto scrollbar-thin">
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-[11px] text-slate-600 italic text-center">
                  {q ? `No matches for "${query}"` : emptyLabel}
                </div>
              ) : filtered.map((opt) => {
                const active = selected.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggle(opt.value)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition
                      ${active ? 'bg-sky-500/10 text-sky-100' : 'text-slate-300 hover:bg-white/5'}`}
                  >
                    <div className={`h-4 w-4 rounded border grid place-items-center shrink-0 transition
                      ${active ? 'bg-sky-500/30 border-sky-500/60' : 'border-slate-600'}`}>
                      {active && <Check className="w-3 h-3 text-sky-200" />}
                    </div>
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between border-t border-white/5 px-3 py-2 bg-slate-950/40 text-[10px] uppercase tracking-widest">
              <button
                type="button"
                onClick={selectAllFiltered}
                disabled={filtered.length === 0}
                className="text-sky-400 hover:text-sky-300 disabled:opacity-30 disabled:cursor-not-allowed font-semibold"
              >
                Select {q ? 'filtered' : 'all'}
              </button>
              <span className="text-slate-600 normal-case tracking-normal">
                {selected.length} / {options.length}
              </span>
              <button
                type="button"
                onClick={clearAll}
                disabled={selected.length === 0}
                className="text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed font-semibold"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selected.map((v) => {
            const lbl = options.find((o) => o.value === v)?.label ?? v;
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-100 text-[11px]"
              >
                {lbl}
                <button
                  type="button"
                  onClick={() => toggle(v)}
                  className="h-4 w-4 grid place-items-center rounded hover:bg-sky-500/30 text-sky-300 hover:text-white transition"
                  title="Remove"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {hint && <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{hint}</div>}
    </div>
  );
}

function DiscardConfirm({ onKeep, onDiscard }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-sm rounded-2xl border border-rose-500/25
        bg-gradient-to-b from-slate-900/95 to-slate-950/95
        shadow-[0_30px_120px_rgba(0,0,0,0.8)] overflow-hidden animate-[fadeIn_0.15s_ease-out]">
        <div className="px-6 py-5 border-b border-white/10 flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-rose-500/15 border border-rose-500/30 grid place-items-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-300" />
          </div>
          <div>
            <div className="text-[10px] text-rose-400 uppercase tracking-widest mb-1">Unsaved changes</div>
            <h3 className="text-base font-semibold text-slate-100">Discard this rule?</h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              You'll lose everything you've filled in. The rule has not been saved yet.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-950/40 flex gap-3">
          <button
            autoFocus
            onClick={onKeep}
            className="flex-1 px-4 py-2.5 rounded-xl border border-sky-500/40 bg-sky-500/15 text-sky-100 hover:bg-sky-500/25 text-sm font-semibold transition"
          >
            Keep editing
          </button>
          <button
            onClick={onDiscard}
            className="flex-1 px-4 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 text-sm font-semibold transition"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmCreateModal({ form, destinationLabel, submitting, onCancel, onConfirm }) {
  const Row = ({ label, value, accent }) => (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-white/5 last:border-b-0">
      <div className="text-[10px] text-slate-500 uppercase tracking-widest pt-0.5 shrink-0">{label}</div>
      <div className={`text-sm text-right ${accent ?? 'text-slate-200'} max-w-[60%] break-words`}>{value}</div>
    </div>
  );
  const list = (arr, fallback = '—') =>
    !arr || arr.length === 0 ? <span className="text-slate-500 italic">{fallback}</span>
    : (
      <div className="flex flex-wrap gap-1 justify-end">
        {arr.map((v) => (
          <span key={v} className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-200 text-[11px]">{v}</span>
        ))}
      </div>
    );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-emerald-500/20
          bg-gradient-to-b from-slate-900/95 to-slate-950/95
          shadow-[0_30px_120px_rgba(0,0,0,0.75)] overflow-hidden animate-[fadeIn_0.18s_ease-out]"
      >
        <div className="relative px-6 py-5 border-b border-white/10">
          <div className="absolute inset-0 opacity-50 bg-[radial-gradient(600px_circle_at_50%_0%,rgba(16,185,129,0.14),transparent_55%)]" />
          <div className="relative flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 grid place-items-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-[10px] text-emerald-400 uppercase tracking-widest mb-1">Confirm Creation</div>
              <h3 className="text-base font-semibold text-slate-100">Review the routing rule</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                One routing rule will be created. It will match any lead whose
                source / campaign / form is in the lists below.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          <Row label="Rule Name" value={<span className="text-sky-200 font-semibold">{form.rule_name?.trim() || '—'}</span>} />
          <Row label="Start Date" value={fmtDate(form.startDate)} />
          <Row label="End Date" value={form.endDate
            ? fmtDate(form.endDate)
            : <span className="text-emerald-300 inline-flex items-center gap-1"><Infinity className="w-3 h-3" /> realtime forever</span>} />
          <Row label="Sources" value={list(form.sources)} />
          <Row label="Campaign Names" value={list(form.campaign_names, 'any')} />
          <Row label="Form Names" value={list(form.form_names, 'any')} />
          <Row label="Destination" value={<span className="text-emerald-300">{destinationLabel ?? form.destination_campaign}</span>} />
          <Row label="Status"
            value={form.isActive
              ? <span className="text-emerald-300 inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Active immediately</span>
              : <span className="text-slate-400 inline-flex items-center gap-1"><Pause className="w-3.5 h-3.5" /> Start paused</span>} />
        </div>

        <div className="px-6 py-4 border-t border-white/10 bg-slate-950/40 flex gap-3">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/8 text-sm transition disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4 inline mr-1" /> Go back
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20
              px-4 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? (<><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>)
              : (<><Check className="w-4 h-4" /> Confirm & Create</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreateRuleModal({ open, onClose }) {
  const { success, error } = useToast();
  const [createLead, { isLoading }] = useCreateCampaignLeadMutation();

  const [form, setForm] = useState(EMPTY);
  const [step, setStep] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [closeRequested, setCloseRequested] = useState(false);

  // Date params drive the lead-filters API so step 2 only shows
  // sources / campaigns / forms that actually have leads in the chosen window.
  const filterParams = useMemo(() => {
    const p = {};
    if (form.startDate) p.sd = form.startDate;
    if (form.endDate)   p.ed = form.endDate;
    return p;
  }, [form.startDate, form.endDate]);

  const {
    data: filtersData,
    isFetching: filtersFetching,
    isError: filtersIsError,
    error: filtersError,
    refetch: refetchFilters,
  } = useLeadFiltersQuery(filterParams, { skip: !open || step < 2 });

  const filtersErrorMessage =
    filtersError?.data?.message ??
    filtersError?.error ??
    (filtersError?.status ? `Request failed (${filtersError.status})` : 'Something went wrong');

  useEffect(() => {
    if (filtersIsError) {
      error(`Couldn't load filter options — ${filtersErrorMessage}`);
    }
  }, [filtersIsError, filtersErrorMessage, error]);

  const {
    data: campaignList,
    isLoading: campaignListLoading,
  } = useGetCampaignsQuery(undefined, { skip: !open });

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setStep(1);
      setConfirmOpen(false);
      setSubmitting(false);
      setCloseRequested(false);
    }
  }, [open]);

  // New API shape: { forms: [{ form_name, sources: [...], campaign_names: [...] }] }
  // Cascade: source → narrows campaign options → narrows form options
  const formsData = filtersData?.forms ?? [];

  const sourceOpts = useMemo(() => {
    const acc = new Set();
    formsData.forEach((f) => (f?.sources ?? []).forEach((s) => s && acc.add(s)));
    return Array.from(acc).sort().map((v) => ({ value: v, label: v }));
  }, [formsData]);

  const campaignNameOpts = useMemo(() => {
    if (form.sources.length === 0) return [];
    const acc = new Set();
    formsData.forEach((f) => {
      const sourceHit = (f?.sources ?? []).some((s) => form.sources.includes(s));
      if (!sourceHit) return;
      (f?.campaign_names ?? []).forEach((c) => c && acc.add(c));
    });
    return Array.from(acc).sort().map((v) => ({ value: v, label: v }));
  }, [formsData, form.sources]);

  const formNameOpts = useMemo(() => {
    if (form.sources.length === 0) return [];
    const acc = new Set();
    formsData.forEach((f) => {
      const sourceHit = (f?.sources ?? []).some((s) => form.sources.includes(s));
      if (!sourceHit) return;
      if (form.campaign_names.length > 0) {
        const campaignHit = (f?.campaign_names ?? []).some((c) => form.campaign_names.includes(c));
        if (!campaignHit) return;
      }
      if (f?.form_name) acc.add(f.form_name);
    });
    return Array.from(acc).sort().map((v) => ({ value: v, label: v }));
  }, [formsData, form.sources, form.campaign_names]);

  // Auto-prune selected campaigns / forms when their parent filter narrows them away
  useEffect(() => {
    const valid = new Set(campaignNameOpts.map((o) => o.value));
    setForm((f) => {
      const next = f.campaign_names.filter((v) => valid.has(v));
      return next.length === f.campaign_names.length ? f : { ...f, campaign_names: next };
    });
  }, [campaignNameOpts]);

  useEffect(() => {
    const valid = new Set(formNameOpts.map((o) => o.value));
    setForm((f) => {
      const next = f.form_names.filter((v) => valid.has(v));
      return next.length === f.form_names.length ? f : { ...f, form_names: next };
    });
  }, [formNameOpts]);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const ruleNameTrimmed = form.rule_name.trim();
  const nameValid  = ruleNameTrimmed.length > 0;
  const step1Valid = !!form.startDate && (!form.endDate || form.endDate >= form.startDate);
  const step2Valid = form.sources.length > 0;
  const step3Valid = !!form.destination_campaign;
  const allValid   = nameValid && step1Valid && step2Valid && step3Valid;

  // Any user input means a close attempt should ask for confirmation
  const dirty = !!(
    ruleNameTrimmed ||
    form.startDate || form.endDate ||
    form.sources.length || form.campaign_names.length || form.form_names.length ||
    form.destination_campaign ||
    !form.isActive
  );

  const requestClose = () => {
    if (submitting) return;
    if (dirty) setCloseRequested(true);
    else onClose();
  };

  const destinationOpts = (campaignList?.data ?? []).map((c) => ({
    value: c.campaign_id,
    label: `${c.campaign_name} (${c.campaign_id})`,
  }));

  const destinationLabel = destinationOpts.find(
    (o) => o.value === form.destination_campaign
  )?.label;

  const handleNext = () => {
    if (step === 1 && step1Valid) setStep(2);
    else if (step === 2 && step2Valid) setStep(3);
  };
  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleConfirmCreate = async () => {
    if (!allValid || submitting) return;
    setSubmitting(true);
    try {
      await createLead({
        rule_name: ruleNameTrimmed,
        source: form.sources,
        campaign_name: form.campaign_names,
        form_name: form.form_names,
        destination_campaign: form.destination_campaign,
        startDate: form.startDate,
        endDate: form.endDate?.trim() || null,
        isActive: form.isActive,
      }).unwrap();
      success('Routing rule created');
      onClose();
    } catch {
      error('Failed to create routing rule');
    } finally {
      setSubmitting(false);
    }
  };

  const dateInputCls = `w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-200
    focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/40 transition [color-scheme:dark]`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-white/10
          bg-gradient-to-b from-slate-900/95 to-slate-950/95
          shadow-[0_30px_120px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-white/10 shrink-0">
          <div className="absolute inset-0 opacity-50 bg-[radial-gradient(600px_circle_at_20%_0%,rgba(56,189,248,0.12),transparent_50%)]" />
          <div className="relative flex items-center gap-4">
            <div className="min-w-0 shrink-0">
              <div className="text-[10px] text-sky-400 uppercase tracking-widest mb-0.5">New Routing Rule</div>
              <h3 className="text-base font-semibold text-slate-100 leading-tight">Create Lead Distribution Rule</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {STEPS[step - 1].desc} · Step {step} of {STEPS.length}
              </p>
            </div>

            <div className="flex-1 min-w-0 mr-12">
              <label
                htmlFor="rule-name-input"
                className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1"
              >
                <Tag className="w-3 h-3" /> Rule Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="rule-name-input"
                type="text"
                value={form.rule_name}
                onChange={(e) => set('rule_name', e.target.value)}
                placeholder="e.g. Meta Realtime → Sales"
                maxLength={120}
                title="Editable in every step — required before review & create"
                className={`w-full rounded-lg border bg-slate-900/80 px-3 py-2  text-sm text-slate-100
                  placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/40 transition
                  ${nameValid ? 'border-slate-700' : 'border-rose-500/30'}`}
              />
            </div>

            <button
              onClick={requestClose}
              title={dirty ? 'Discard changes' : 'Close'}
              className="h-8 w-8 grid place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-rose-400 transition shrink-0 "
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <StepRail current={step} />

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-[320px]">

          {/* STEP 1: Date Range */}
          {step === 1 && (
            <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-sky-500/15 border border-sky-500/30 grid place-items-center shrink-0">
                    <CalendarRange className="w-4 h-4 text-sky-300" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">Pick the active window</div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      The rule will route leads only between these dates. The chosen window also scopes
                      the source / campaign / form options shown in the next step — so you only see
                      filters that actually have leads in this period.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Start Date <span className="text-rose-400">*</span>
                  </label>
                  <DatePicker
                    selected={ymdToDate(form.startDate)}
                    onChange={(d) => set('startDate', dateToYMD(d))}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="yyyy-mm-dd"
                    className={dateInputCls}
                    wrapperClassName="block w-full"
                    popperClassName="dark-datepicker z-[60]"
                    popperProps={{ strategy: 'fixed' }}
                  />
                  <div className="text-[10px] text-slate-600">When the rule starts matching leads</div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> End Date <span className="text-slate-600">(optional)</span>
                  </label>
                  <div className="relative">
                    <DatePicker
                      selected={ymdToDate(form.endDate)}
                      minDate={ymdToDate(form.startDate) || undefined}
                      onChange={(d) => set('endDate', dateToYMD(d))}
                      dateFormat="yyyy-MM-dd"
                      placeholderText="yyyy-mm-dd"
                      className={dateInputCls}
                      wrapperClassName="block w-full"
                      popperClassName="dark-datepicker z-[60]"
                      popperProps={{ strategy: 'fixed' }}
                    />
                    {form.endDate && (
                      <button
                        type="button"
                        onClick={() => set('endDate', '')}
                        className="absolute inset-y-0 right-2 my-auto h-6 w-6 grid place-items-center rounded text-slate-500 hover:text-rose-400 hover:bg-white/5 transition z-10"
                        title="Clear end date"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="text-[10px] text-emerald-400/80 flex items-center gap-1">
                    <Infinity className="w-3 h-3" /> Leave blank → routes forever in realtime
                  </div>
                </div>
              </div>

              {form.startDate && form.endDate && form.endDate < form.startDate && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  End date must be on or after the start date.
                </div>
              )}

              {form.startDate && (
                <div className="rounded-xl border border-white/8 bg-slate-950/40 p-3 flex items-center gap-3">
                  <Clock3 className="w-4 h-4 text-slate-500 shrink-0" />
                  <div className="text-[11px] text-slate-400">
                    Active from <span className="text-slate-200 font-medium">{fmtDate(form.startDate)}</span>
                    {form.endDate
                      ? <> until <span className="text-slate-200 font-medium">{fmtDate(form.endDate)}</span></>
                      : <> · <span className="text-emerald-300 font-medium">no expiry</span></>
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Filters */}
          {step === 2 && (
            <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-sky-500/15 border border-sky-500/30 grid place-items-center shrink-0">
                    <FilterIcon className="w-4 h-4 text-sky-300" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">Choose what to match</div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Selections cascade: pick a <span className="text-sky-300 font-medium">Source</span> first,
                      then the available <span className="text-sky-300 font-medium">Campaigns</span> and
                      {' '}<span className="text-sky-300 font-medium">Forms</span> are filtered to only those
                      tied to that source. Source is required; campaign and form are optional refinements.
                    </p>
                  </div>
                </div>
              </div>

              {filtersIsError ? (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-rose-500/15 border border-rose-500/30 grid place-items-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-rose-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-rose-200">Couldn't load filter options</div>
                    <p className="text-[11px] text-rose-300/80 mt-1 leading-relaxed break-words">
                      {filtersErrorMessage}
                    </p>
                    <button
                      type="button"
                      onClick={refetchFilters}
                      disabled={filtersFetching}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10
                        px-3 py-1.5 text-[11px] font-semibold text-rose-100 hover:bg-rose-500/20 transition
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {filtersFetching
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <RefreshCw className="w-3 h-3" />}
                      {filtersFetching ? 'Retrying…' : 'Retry'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <MultiSelectDropdown
                    label="Source"
                    required
                    icon={Tag}
                    hint="The lead source / channel (e.g. Meta, Google, Instagram). Drives the campaign and form options below."
                    placeholder="Select source(s)…"
                    options={sourceOpts}
                    selected={form.sources}
                    onChange={(arr) => set('sources', arr)}
                    loading={filtersFetching}
                    emptyLabel="No sources found in this date range"
                  />

                  <MultiSelectDropdown
                    label="Campaign Name"
                    icon={Layers}
                    hint={
                      form.sources.length === 0
                        ? "Pick a source above first — campaign options depend on it."
                        : `Optional. ${campaignNameOpts.length} campaign${campaignNameOpts.length === 1 ? '' : 's'} available for the selected source${form.sources.length === 1 ? '' : 's'}.`
                    }
                    placeholder="Any campaign — pick to narrow down…"
                    disabledHint="Pick a source first…"
                    disabled={form.sources.length === 0}
                    options={campaignNameOpts}
                    selected={form.campaign_names}
                    onChange={(arr) => set('campaign_names', arr)}
                    loading={filtersFetching}
                    emptyLabel="No campaigns tied to the selected source(s)"
                  />

                  <MultiSelectDropdown
                    label="Form Name"
                    icon={FileText}
                    hint={
                      form.sources.length === 0
                        ? "Pick a source above first — form options depend on it."
                        : `Optional. ${formNameOpts.length} form${formNameOpts.length === 1 ? '' : 's'} available for your current source${form.campaign_names.length > 0 ? ' & campaign' : ''} selection.`
                    }
                    placeholder="Any form — pick to narrow down…"
                    disabledHint="Pick a source first…"
                    disabled={form.sources.length === 0}
                    options={formNameOpts}
                    selected={form.form_names}
                    onChange={(arr) => set('form_names', arr)}
                    loading={filtersFetching}
                    emptyLabel="No forms tied to the selected source(s) / campaign(s)"
                  />
                </>
              )}
            </div>
          )}

          {/* STEP 3: Destination */}
          {step === 3 && (
            <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-sky-500/15 border border-sky-500/30 grid place-items-center shrink-0">
                    <Target className="w-4 h-4 text-sky-300" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">Pick the VICIdial destination</div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Matched leads will be pushed into this VICIdial campaign for dialing.
                      You can pause or resume the rule at any time from the routing list.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Target className="w-3 h-3" /> VICIdial Destination <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.destination_campaign}
                    onChange={(e) => set('destination_campaign', e.target.value)}
                    disabled={campaignListLoading}
                    className={`w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-200
                      focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/40 transition
                      [color-scheme:dark] appearance-none cursor-pointer disabled:opacity-40`}
                  >
                    <option value="" disabled hidden>
                      {campaignListLoading ? 'Loading campaigns…' : 'Select a VICIdial campaign…'}
                    </option>
                    {destinationOpts.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    {campaignListLoading
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                      : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  </div>
                </div>
                <div className="text-[10px] text-slate-600">The VICIdial campaign that will receive these leads</div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-white/8 bg-slate-950/40 px-4 py-3.5">
                <button
                  type="button"
                  onClick={() => set('isActive', !form.isActive)}
                  className={`relative h-6 w-11 rounded-full border transition shrink-0 mt-0.5
                    ${form.isActive ? 'bg-emerald-500/30 border-emerald-500/40' : 'bg-slate-800/60 border-slate-700'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all shadow
                    ${form.isActive ? 'left-5' : 'left-0.5'}`} />
                </button>
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${form.isActive ? 'text-emerald-300' : 'text-slate-400'}`}>
                    {form.isActive ? 'Active immediately' : 'Start paused'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {form.isActive
                      ? "The rule will start routing matching leads to VICIdial as soon as it's created."
                      : "The rule will be saved but won't route anything until you flip it to active."}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/8 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-4">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" /> About to create
                </div>
                <div className="text-sm text-slate-200">
                  Routing rule
                  {destinationLabel && <> → <span className="text-emerald-300">{destinationLabel}</span></>}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Matches{' '}
                  <span className="text-sky-300">{form.sources.length}</span> source{form.sources.length === 1 ? '' : 's'}
                  {form.campaign_names.length > 0 && <> · <span className="text-sky-300">{form.campaign_names.length}</span> campaign{form.campaign_names.length === 1 ? '' : 's'}</>}
                  {form.form_names.length > 0     && <> · <span className="text-sky-300">{form.form_names.length}</span> form{form.form_names.length === 1 ? '' : 's'}</>}
                  {' · '}{form.isActive ? 'will go live immediately.' : 'will be saved as paused.'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-950/40 shrink-0 flex items-center justify-between gap-3">
          <button
            onClick={step === 1 ? requestClose : handleBack}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/8 text-sm transition"
          >
            {step === 1 ? 'Cancel' : (<><ChevronLeft className="w-4 h-4" /> Back</>)}
          </button>

          <div className="text-[10px] text-slate-500 uppercase tracking-widest hidden sm:block">
            {step === 1 && (step1Valid ? 'Ready to continue' : 'Pick a start date')}
            {step === 2 && (step2Valid
              ? `${form.sources.length} source${form.sources.length === 1 ? '' : 's'} selected`
              : 'Pick at least one source')}
            {step === 3 && (
              !step3Valid ? 'Pick a destination'
              : !nameValid ? 'Name the rule to continue'
              : 'Ready to review'
            )}
          </div>

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
              className="flex items-center gap-1.5 rounded-xl border border-sky-600/40 bg-sky-600/20
                px-5 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-600/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={!allValid || isLoading || submitting}
              title={!nameValid ? 'Rule name is required' : undefined}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20
                px-5 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-4 h-4" /> Review & Create
            </button>
          )}
        </div>
      </div>

      {confirmOpen && (
        <ConfirmCreateModal
          form={form}
          destinationLabel={destinationLabel}
          submitting={submitting || isLoading}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmCreate}
        />
      )}

      {closeRequested && (
        <DiscardConfirm
          onKeep={() => setCloseRequested(false)}
          onDiscard={() => { setCloseRequested(false); onClose(); }}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        #rule-name-input:-webkit-autofill,
        #rule-name-input:-webkit-autofill:hover,
        #rule-name-input:-webkit-autofill:focus,
        #rule-name-input:-webkit-autofill:active {
          -webkit-text-fill-color: rgb(241 245 249) !important;
          -webkit-box-shadow: 0 0 0 1000px rgb(15 23 42 / 0.8) inset !important;
          caret-color: rgb(241 245 249) !important;
          transition: background-color 9999s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
}
