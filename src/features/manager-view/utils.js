import { format } from 'date-fns';

// ────────────────────────── Formatters ──────────────────────────

// Render nulls / empty as an em-dash, never "null".
export const dash = (v) => (v === null || v === undefined || v === '' ? '—' : v);

export function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Timestamps arrive as plain "YYYY-MM-DD HH:MM:SS" (or "…THH:MM:SS") strings with no zone —
// parse as LOCAL, never assume ISO/Z.
function parseLocal(s) {
  if (!s) return null;
  const [datePart, timePart = ''] = String(s).replace('T', ' ').trim().split(' ');
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return null;
  const [hh = 0, mm = 0, ss = 0] = timePart.split(':').map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0, ss || 0);
}

export function fmtDateTime(s) {
  const dt = parseLocal(s);
  return dt ? format(dt, 'dd MMM yyyy, HH:mm') : dash(s);
}

export function fmtDate(s) {
  const dt = parseLocal(s);
  return dt ? format(dt, 'dd MMM yyyy') : dash(s);
}

// Day bucket key ("YYYY-MM-DD") used to group calls-over-time.
export function dayKey(s) {
  const dt = parseLocal(s);
  return dt ? format(dt, 'yyyy-MM-dd') : null;
}

export function fmtDuration(sec) {
  const n = Number(sec);
  if (!Number.isFinite(n) || n <= 0) return '—';
  const m = Math.floor(n / 60);
  const r = Math.floor(n % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}

export const fmtPct = (n) => `${Number(n || 0).toFixed(1)}%`;
const pct = (num, den) => (den > 0 ? (num / den) * 100 : 0);
const round1 = (n) => Math.round(n * 10) / 10;

// ────────────────────────── Predicates ──────────────────────────

const truthy = (v) => v === true || v === 'true' || v === 1 || v === '1' || v === 'yes' || v === 'Yes';

// VICIdial status codes, as this dialer actually uses them (vicidial_statuses +
// vicidial_campaign_statuses). Interested is 'IN' — the old check for 'INTR' never matched.
const STATUS = {
  interested: ['IN', 'SALE', 'CON'],
  notInterested: ['NI', 'DNC', 'DEC', 'NP'],
  callback: ['CBR', 'CBHOLD', 'CALLBK', 'FUC'],
  noAnswer: ['N', 'NA', 'B', 'AB', 'AA', 'AM', 'AL'],
  invalid: ['INVN', 'WN', 'DC', 'D', 'ADC', 'ADCT'],
  // Set by the dialer itself, not chosen by an agent — the agent has not given the lead a
  // result yet. Counting these made "Result Saved" equal every lead called.
  undispositioned: [
    'NEW', 'INCALL', 'QUEUE', 'DISPO', 'AB', 'AA', 'NA', 'AL', 'AM', 'AFAX', 'ADC', 'ADCT',
    'DROP', 'PDROP', 'XDROP', 'ERI', 'LRERR', 'IQNANQ', 'TIMEOT',
  ],
};
const statusIn = (r, list) => list.includes(String(r.vici_lead_status || '').toUpperCase());

const saysNotInterested = (r) => /not\s*interest/i.test(r.response || '');

// "not interested" contains "interest" — it used to count as Interested AND Not Interested.
const isInterested = (r) =>
  statusIn(r, STATUS.interested) || (/interest/i.test(r.response || '') && !saysNotInterested(r));

const isNotInterested = (r) => saysNotInterested(r) || statusIn(r, STATUS.notInterested);

// Any status counted before, including NEW — a lead nobody had touched showed as "updated".
const hasDisposition = (r) =>
  !!(r.response || r.last_status_change)
  || (!!r.vici_lead_status && !statusIn(r, STATUS.undispositioned));

const isCallback = (r) => /call\s*back|callback/i.test(r.response || '') || statusIn(r, STATUS.callback);

const isRNR = (r) => /rnr|no\s*answer|ring/i.test(r.response || '') || statusIn(r, STATUS.noAnswer);

// A real conversation happened on this call (the analyser heard both sides talk).
const spokeOnCall = (r) => r.analysis_status === 'successful';

// Who made the call. agent_name on the row is the follow-up NOTE's author, not the caller.
export const callerOf = (r) => r.caller_name || r.agent_user || null;

// Best-effort KYC detection from the free-form custom_fields (e.g. { kyc_status: "Completed" }).
const kycDone = (r) => {
  const cf = r.custom_fields;
  if (!cf || typeof cf !== 'object') return false;
  return Object.entries(cf).some(
    ([k, v]) => /kyc/i.test(k) && (truthy(v) || /complete|done|approved/i.test(String(v))),
  );
};

// Normalize how_contacted (array | comma-string) → clean array.
export const toContactArray = (v) => {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (!v) return [];
  return String(v).split(',').map((s) => s.trim()).filter(Boolean);
};

// ────────────────────────── Lead-level reduction ──────────────────────────
// The combined feed is call-centric (one row per call). Funnel / mixes / status are lead-centric,
// so collapse to one record per distinct lead_id (rows with a null lead_id have no Meta lead and
// are excluded from lead-based stats — they still count as calls in the KPIs).
function dedupeLeads(data) {
  const map = new Map();
  for (const r of data) {
    if (r.lead_id === null || r.lead_id === undefined) continue;
    const prev = map.get(r.lead_id);
    if (!prev) {
      map.set(r.lead_id, {
        lead_id: r.lead_id,
        lead_created_at: r.lead_created_at || null,
        // Assigned = the lead has an owner in the dialer. Every call row has a caller,
        // so "assigned by caller" made Unassigned always 0.
        owner: r.lead_owner_name || r.lead_owner || null,
        caller: callerOf(r),
        campaign_name: r.campaign_name || null,
        ad_set_name: r.ad_set_name || null,
        ad_name: r.ad_name || null,
        form_name: r.form_name || null,
        source: r.source || null,
        spoke: spokeOnCall(r),
        invalid: statusIn(r, STATUS.invalid) || /invalid|wrong\s*number/i.test(r.response || ''),
        response: r.response || null,
        vici_lead_status: r.vici_lead_status || null,
        vici_status_name: r.vici_status_name || null,
        registered: truthy(r.client_registered),
        deposited: truthy(r.client_deposited),
        interested: isInterested(r),
        disposition: hasDisposition(r),
        callback: isCallback(r),
        rnr: isRNR(r),
        notInterested: isNotInterested(r),
        kyc: kycDone(r),
        how_contacted: toContactArray(r.how_contacted),
        raw: { ...(r.raw_data || {}), ...(r.custom_fields || {}) },
      });
    } else {
      // Any positive signal across the lead's calls counts.
      prev.lead_created_at = prev.lead_created_at || r.lead_created_at || null;
      prev.owner = prev.owner || r.lead_owner_name || r.lead_owner || null;
      prev.caller = prev.caller || callerOf(r);
      prev.spoke = prev.spoke || spokeOnCall(r);
      prev.invalid = prev.invalid || statusIn(r, STATUS.invalid) || /invalid|wrong\s*number/i.test(r.response || '');
      prev.registered = prev.registered || truthy(r.client_registered);
      prev.deposited = prev.deposited || truthy(r.client_deposited);
      prev.interested = prev.interested || isInterested(r);
      prev.disposition = prev.disposition || hasDisposition(r);
      prev.callback = prev.callback || isCallback(r);
      prev.rnr = prev.rnr || isRNR(r);
      prev.notInterested = prev.notInterested || isNotInterested(r);
      prev.kyc = prev.kyc || kycDone(r);
      prev.response = prev.response || r.response || null;
      prev.vici_lead_status = prev.vici_lead_status || r.vici_lead_status || null;
      prev.vici_status_name = prev.vici_status_name || r.vici_status_name || null;
      prev.how_contacted = Array.from(new Set([...prev.how_contacted, ...toContactArray(r.how_contacted)]));
      prev.raw = { ...prev.raw, ...(r.raw_data || {}), ...(r.custom_fields || {}) };
    }
  }
  return Array.from(map.values());
}

// ────────────────────────── KPI cards ──────────────────────────
export function computeKpis(data = []) {
  const leads = dedupeLeads(data);
  const ratings = data.map((r) => Number(r.overall_rating)).filter((n) => Number.isFinite(n));
  const stars = data.map((r) => Number(r.call_stars)).filter((n) => Number.isFinite(n));
  const registered = leads.filter((l) => l.registered).length;
  const deposited = leads.filter((l) => l.deposited).length;
  const avg = (arr) => (arr.length ? round1(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
  return {
    totalCalls: data.length,
    leadsMatched: leads.length,
    registered,
    deposited,
    avgRating: avg(ratings),
    avgStars: avg(stars),
    conversionRate: round1(pct(deposited, leads.length)),
    registeredRate: round1(pct(registered, leads.length)),
  };
}

// ────────────────────────── Lead Funnel ──────────────────────────
export function computeLeadFunnel(data = []) {
  const leads = dedupeLeads(data);
  const total = leads.length;
  const rows = [
    ['Leads Called', total],
    ['Spoke with Client', leads.filter((l) => l.spoke).length],
    ['Result Updated', leads.filter((l) => l.disposition).length],
    ['Interested', leads.filter((l) => l.interested).length],
    ['Account Opened', leads.filter((l) => l.registered).length],
    ['KYC Completed', leads.filter((l) => l.kyc).length],
    ['FTD Received', leads.filter((l) => l.deposited).length],
  ];
  return rows.map(([stage, count]) => ({ stage, count, pct: round1(pct(count, total)) }));
}

// ────────────────────────── Agent Performance ──────────────────────────
export function computeAgentPerformance(data = []) {
  const leads = dedupeLeads(data);
  const map = new Map();
  for (const l of leads) {
    // Credited to the agent who CALLED (the newest call's caller), by name.
    const key = l.caller;
    if (!key) continue;
    const a = map.get(key) || { agent: key, assigned: 0, spoke: 0, updated: 0, interested: 0, accounts: 0, kyc: 0 };
    a.assigned += 1;
    if (l.spoke) a.spoke += 1;
    if (l.disposition) a.updated += 1;
    if (l.interested) a.interested += 1;
    if (l.registered) a.accounts += 1;
    if (l.kyc) a.kyc += 1;
    map.set(key, a);
  }
  return Array.from(map.values()).sort((x, y) => y.assigned - x.assigned);
}

// ────────────────────────── Priority Actions ──────────────────────────
export function computePriorityActions(data = []) {
  const leads = dedupeLeads(data);
  return [
    { action: 'No agent owns the lead', count: leads.filter((l) => !l.owner).length },
    { action: 'Called, but no result saved', count: leads.filter((l) => !l.disposition).length },
    { action: 'Callback promised', count: leads.filter((l) => l.callback).length },
    { action: 'Did not pick up — try again', count: leads.filter((l) => l.rnr && !l.spoke).length },
    { action: 'Account Open, KYC Pending', count: leads.filter((l) => l.registered && !l.kyc).length },
    { action: 'KYC Complete, FTD Pending', count: leads.filter((l) => l.kyc && !l.deposited).length },
  ];
}

// ────────────────────────── Lead Status Overview ──────────────────────────
const STATUS_ORDER = [
  'New / Unworked', 'Assigned', 'Contacted', 'Qualified',
  'Account Opened', 'KYC Completed', 'Deposited', 'Lost',
];

function statusOf(l) {
  if (l.deposited) return 'Deposited';
  if (l.kyc) return 'KYC Completed';
  if (l.registered) return 'Account Opened';
  if (l.notInterested) return 'Lost';
  if (l.interested) return 'Qualified';
  if (l.disposition) return 'Contacted';
  if (l.owner) return 'Assigned';
  return 'New / Unworked';
}

export function computeStatusOverview(data = []) {
  const leads = dedupeLeads(data);
  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0]));
  for (const l of leads) counts[statusOf(l)] += 1;
  return STATUS_ORDER.map((status) => ({ status, count: counts[status] }));
}

// ────────────────────────── Key Conversion Rates ──────────────────────────
export function computeConversionRates(data = []) {
  const leads = dedupeLeads(data);
  const total = leads.length;
  const interested = leads.filter((l) => l.interested).length;
  const accounts = leads.filter((l) => l.registered).length;
  const ftd = leads.filter((l) => l.deposited).length;
  return [
    { label: 'Lead → Interested', value: round1(pct(interested, total)) },
    { label: 'Interested → Account', value: round1(pct(accounts, interested)) },
    { label: 'Lead → FTD', value: round1(pct(ftd, total)) },
  ];
}

// ────────────────────────── Mixes ──────────────────────────
function tally(items) {
  const map = new Map();
  for (const it of items) {
    if (it === null || it === undefined || it === '') continue;
    map.set(it, (map.get(it) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export function computeCommunicationMix(data = []) {
  const leads = dedupeLeads(data);
  const flat = [];
  for (const l of leads) flat.push(...l.how_contacted);
  return tally(flat);
}

export function computeDispositionMix(data = []) {
  const leads = dedupeLeads(data);
  // The dialer result in words ("Not Interested"), not its code ("NI").
  return tally(leads.map((l) => l.vici_status_name || l.vici_lead_status || l.response));
}

// Free-form Meta-form fields (Lead Type / Experience) live in raw_data / custom_fields under
// form-specific keys. Match keys by normalized substring so it works across forms; tune here.
export const RAW_KEY_MAP = {
  leadType: ['leadtype', 'whatbestdescribes', 'describesyou', 'partnertype', 'iamin', 'iam', 'category'],
  experience: ['experience', 'tradingexperience', 'howlong', 'yearsoftrading', 'yearstrading'],
  ftdAmount: ['ftdamount', 'firstdepositamount', 'depositamount', 'ftdamt'],
  redeposit: ['redeposit', 'redepositamount', 'redepamount', 'additionaldeposit'],
  nextAction: ['nextaction', 'nextstep', 'followupaction'],
  accountStatus: ['accountstatus', 'accountopen', 'accountopened'],
  kycStatus: ['kyc', 'kycstatus'],
  ftdStatus: ['ftdstatus', 'ftd', 'firsttimedeposit'],
  comments: ['comment', 'comments', 'remark', 'notes'],
};

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

function pickRawValue(raw, candidates) {
  if (!raw || typeof raw !== 'object') return null;
  for (const [k, v] of Object.entries(raw)) {
    const nk = norm(k);
    if (candidates.some((c) => nk.includes(c))) {
      if (Array.isArray(v)) return v.length ? String(v[0]) : null;
      return v === null || v === undefined || v === '' ? null : String(v);
    }
  }
  return null;
}

function computeRawMix(data, candidates) {
  const leads = dedupeLeads(data);
  return tally(leads.map((l) => pickRawValue(l.raw, candidates)));
}

export const computeLeadTypeMix = (data = []) => computeRawMix(data, RAW_KEY_MAP.leadType);
export const computeExperienceMix = (data = []) => computeRawMix(data, RAW_KEY_MAP.experience);

// ────────────────────────── Charts ──────────────────────────
export function computeOutcomeDist(data = []) {
  return tally(data.map((r) => r.call_outcome)).map((d) => ({ name: d.label, value: d.count }));
}

export function computeCallsOverTime(data = []) {
  const map = new Map();
  for (const r of data) {
    const k = dayKey(r.call_date);
    if (!k) continue;
    map.set(k, (map.get(k) || 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, value]) => ({ name: format(parseLocal(day), 'dd MMM'), value }));
}

export function computeCampaignMix(data = []) {
  return tally(data.map((r) => r.campaign_name))
    .slice(0, 8)
    .map((d) => ({ name: d.label, value: d.count }));
}

// ────────────────────────── Reference (spreadsheet) additions ──────────────────────────

const hasRaw = (l, candidates) => pickRawValue(l.raw, candidates) != null;
const leadWhatsApp = (l) => l.how_contacted.some((c) => /whats\s*app/i.test(c));

// Sum numeric values found under any matching raw/custom key across leads (best-effort → 0).
function sumRawNumeric(leads, candidates) {
  let sum = 0;
  for (const l of leads) {
    const v = pickRawValue(l.raw, candidates);
    if (v == null) continue;
    const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
    if (Number.isFinite(n)) sum += n;
  }
  return sum;
}

export const fmtAmount = (n) =>
  Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Data-Completion field spec — each test runs over a deduped lead record. Free-form fields read
// raw_data/custom_fields via RAW_KEY_MAP candidates and degrade to "incomplete" when absent.
export const COMPLETION_FIELDS = [
  { field: 'Agent Name', test: (l) => !!(l.owner || l.caller) },
  { field: 'Disposition', test: (l) => l.disposition },
  { field: 'Interest Level', test: (l) => !!l.response || l.interested },
  { field: 'IB / Retail Classification', test: (l) => hasRaw(l, RAW_KEY_MAP.leadType) },
  { field: 'Next Action', test: (l) => hasRaw(l, RAW_KEY_MAP.nextAction) },
  { field: 'Account Status', test: (l) => l.registered || hasRaw(l, RAW_KEY_MAP.accountStatus) },
  { field: 'KYC Status', test: (l) => l.kyc || hasRaw(l, RAW_KEY_MAP.kycStatus) },
  { field: 'FTD Status', test: (l) => l.deposited || hasRaw(l, RAW_KEY_MAP.ftdStatus) },
  { field: 'FTD Amount', test: (l) => hasRaw(l, RAW_KEY_MAP.ftdAmount) },
  { field: 'Redeposit Amount', test: (l) => hasRaw(l, RAW_KEY_MAP.redeposit) },
  { field: 'Comments', test: (l) => !!l.response || hasRaw(l, RAW_KEY_MAP.comments) },
];

export function computeDataCompletion(data = []) {
  const leads = dedupeLeads(data);
  const total = leads.length;
  return COMPLETION_FIELDS.map(({ field, test }) => {
    const completed = leads.filter(test).length;
    return { field, completed, total, pct: round1(pct(completed, total)) };
  });
}

// Lead-centric KPI band (mirrors the spreadsheet's two summary rows). Amounts are best-effort.
export function computeReferenceKpis(data = []) {
  const leads = dedupeLeads(data);
  const total = leads.length;
  const ratings = data.map((r) => Number(r.overall_rating)).filter((n) => Number.isFinite(n));
  const stars = data.map((r) => Number(r.call_stars)).filter((n) => Number.isFinite(n));
  const avg = (arr) => (arr.length ? round1(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
  const completion = computeDataCompletion(data);
  const salesUpdateCompletion = completion.length
    ? round1(completion.reduce((a, b) => a + b.pct, 0) / completion.length)
    : 0;

  return {
    totalLeads: total,
    assigned: leads.filter((l) => l.owner).length,
    unassigned: leads.filter((l) => !l.owner).length,
    spoke: leads.filter((l) => l.spoke).length,
    notInterested: leads.filter((l) => l.notInterested).length,
    dispositionUpdated: leads.filter((l) => l.disposition).length,
    interested: leads.filter((l) => l.interested).length,
    callbacks: leads.filter((l) => l.callback).length,
    accountsOpened: leads.filter((l) => l.registered).length,
    kycComplete: leads.filter((l) => l.kyc).length,
    ftdReceived: leads.filter((l) => l.deposited).length,
    totalFtdAmount: sumRawNumeric(leads, RAW_KEY_MAP.ftdAmount),
    redepositAmount: sumRawNumeric(leads, RAW_KEY_MAP.redeposit),
    rnr: leads.filter((l) => l.rnr && !l.spoke).length,
    invalidNumbers: leads.filter((l) => l.invalid).length,
    whatsappPreference: leads.filter(leadWhatsApp).length,
    salesUpdateCompletion,
    // carried from Phase 1 so call quality isn't lost
    totalCalls: data.length,
    avgRating: avg(ratings),
    avgStars: avg(stars),
  };
}

// Grouped-bar source: assigned vs updated per agent.
export function computeAgentWorkload(data = []) {
  return computeAgentPerformance(data).map((a) => ({
    agent: a.agent,
    assigned: a.assigned,
    updated: a.updated,
  }));
}

// Leads by creation day (deduped) for the Daily Lead Trend chart.
export function computeDailyLeadTrend(data = []) {
  const leads = dedupeLeads(data);
  const map = new Map();
  for (const l of leads) {
    const k = l.lead_created_at ? dayKey(l.lead_created_at) : null;
    if (!k) continue;
    map.set(k, (map.get(k) || 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, value]) => ({ name: format(parseLocal(day), 'dd MMM'), value }));
}

// ────────────────────────── Ad Performance (marketing) ──────────────────────────
// What happened to the leads each Meta campaign / ad set / ad / form brought in, so marketing
// can judge an ad by its outcomes without leaving the page. One row per distinct lead.
export const AD_GROUPS = [
  { key: 'campaign_name', label: 'Campaign' },
  { key: 'ad_set_name', label: 'Ad Set' },
  { key: 'ad_name', label: 'Ad' },
  { key: 'form_name', label: 'Form' },
];

export function computeAdPerformance(data = [], groupKey = 'campaign_name') {
  const leads = dedupeLeads(data);
  const map = new Map();
  for (const l of leads) {
    // Leads whose Meta record carries no name for this level (organic, uploaded, older rows).
    const key = l[groupKey] || 'Not recorded';
    const a = map.get(key) || {
      name: key, leads: 0, spoke: 0, interested: 0, notInterested: 0,
      callback: 0, noAnswer: 0, invalid: 0, accounts: 0, ftd: 0,
    };
    a.leads += 1;
    if (l.spoke) a.spoke += 1;
    if (l.interested) a.interested += 1;
    if (l.notInterested) a.notInterested += 1;
    if (l.callback) a.callback += 1;
    if (l.rnr && !l.spoke) a.noAnswer += 1;
    if (l.invalid) a.invalid += 1;
    if (l.registered) a.accounts += 1;
    if (l.deposited) a.ftd += 1;
    map.set(key, a);
  }
  return Array.from(map.values())
    .map((a) => ({
      ...a,
      reachRate: round1(pct(a.spoke, a.leads)),
      interestRate: round1(pct(a.interested, a.leads)),
    }))
    .sort((x, y) => y.leads - x.leads);
}
