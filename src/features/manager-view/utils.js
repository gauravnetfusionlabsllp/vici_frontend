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

const isInterested = (r) =>
  /interest/i.test(r.response || '') || String(r.vici_lead_status || '').toUpperCase() === 'INTR';

const isNotInterested = (r) =>
  /not\s*interest/i.test(r.response || '') || ['NI', 'DNC'].includes(String(r.vici_lead_status || '').toUpperCase());

const hasDisposition = (r) => !!(r.vici_lead_status || r.response || r.last_status_change);

const isCallback = (r) =>
  /call\s*back|callback/i.test(r.response || '') || ['CBR', 'CBHOLD', 'CALLBK'].includes(String(r.vici_lead_status || '').toUpperCase());

const isRNR = (r) => {
  const st = String(r.vici_lead_status || '').toUpperCase();
  return /rnr|no\s*answer|ring/i.test(r.response || '') || ['RNR', 'NA', 'N', 'A', 'B'].includes(st);
};

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
        agent_user: r.agent_user || null,
        agent_name: r.agent_name || null,
        campaign_name: r.campaign_name || null,
        response: r.response || null,
        vici_lead_status: r.vici_lead_status || null,
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
      prev.agent_user = prev.agent_user || r.agent_user || null;
      prev.agent_name = prev.agent_name || r.agent_name || null;
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
    ['Total Leads', total],
    ['Assigned', leads.filter((l) => l.agent_user).length],
    ['Disposition Updated', leads.filter((l) => l.disposition).length],
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
    const key = l.agent_name || l.agent_user;
    if (!key) continue;
    const a = map.get(key) || { agent: key, assigned: 0, updated: 0, interested: 0, accounts: 0, kyc: 0 };
    a.assigned += 1;
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
    { action: 'Unassigned Leads', count: leads.filter((l) => !l.agent_user).length },
    { action: 'No Disposition', count: leads.filter((l) => l.agent_user && !l.disposition).length },
    { action: 'Callbacks Required', count: leads.filter((l) => l.callback).length },
    { action: 'RNR — Retry Contact', count: leads.filter((l) => l.rnr).length },
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
  if (l.agent_user) return 'Assigned';
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
  return tally(leads.map((l) => l.response || l.vici_lead_status));
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
const leadInvalid = (l) =>
  /invalid/i.test(l.response || '') || ['INVN', 'WN'].includes(String(l.vici_lead_status || '').toUpperCase());

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
  { field: 'Agent Name', test: (l) => !!(l.agent_user || l.agent_name) },
  { field: 'Disposition', test: (l) => !!l.vici_lead_status },
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
    assigned: leads.filter((l) => l.agent_user).length,
    unassigned: leads.filter((l) => !l.agent_user).length,
    dispositionUpdated: leads.filter((l) => l.disposition).length,
    interested: leads.filter((l) => l.interested).length,
    callbacks: leads.filter((l) => l.callback).length,
    accountsOpened: leads.filter((l) => l.registered).length,
    kycComplete: leads.filter((l) => l.kyc).length,
    ftdReceived: leads.filter((l) => l.deposited).length,
    totalFtdAmount: sumRawNumeric(leads, RAW_KEY_MAP.ftdAmount),
    redepositAmount: sumRawNumeric(leads, RAW_KEY_MAP.redeposit),
    rnr: leads.filter((l) => l.rnr).length,
    invalidNumbers: leads.filter(leadInvalid).length,
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
