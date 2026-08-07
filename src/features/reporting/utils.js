import { DISPOSITIONS } from '@/features/leads/constants';

export function shortDate(str) {
  if (!str) return '—';
  return str.slice(0, 16).replace('T', ' ');
}

// Disposition code → human label (same source the grid uses).
const DISPOSITION_LABEL = DISPOSITIONS.reduce((acc, d) => {
  acc[d.value] = d.label;
  return acc;
}, {});

export const dispositionLabel = (code) => (code ? DISPOSITION_LABEL[code] || code : null);

// ────────────────────────── Introducing Broker (IB) ──────────────────────────
// The IB question lives in the Meta form payload (raw_data) under a form-specific key and is
// worded differently per form ("which best describes you", "which opportunity are you interested
// in"), so match keys and answers by normalized substring rather than exact text.
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

const IB_QUESTION_KEYS = [
  'whichbestdescribes',
  'whatbestdescribes',
  'bestdescribesyou',
  'describesyou',
  'opportunityareyouinterested',
  'opportunityinterested',
  'whichopportunity',
];
// Matches both "I am an introducing broker" and "introducing broker (ib) partnership".
const IB_ANSWER = 'introducingbroker';

function parseRaw(data) {
  if (!data) return null;
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return null; }
  }
  return data;
}

// true → the lead answered "I am an introducing broker"; false → answered something else;
// null → the form payload is missing, so there is nothing to judge.
export function isIntroducingBroker(rawData) {
  const raw = parseRaw(rawData);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  // A form can carry more than one of these questions — any IB answer marks the lead as IB.
  for (const [k, v] of Object.entries(raw)) {
    if (!IB_QUESTION_KEYS.some((c) => norm(k).includes(c))) continue;
    const answer = Array.isArray(v) ? v.join(' ') : v;
    if (norm(answer).includes(IB_ANSWER)) return true;
  }
  return false;
}

// Grid-friendly 'Yes' / 'No' / '' so sorting, filtering and export all work off plain text.
export function ibLabel(rawData) {
  const v = isIntroducingBroker(rawData);
  return v === null ? '' : v ? 'Yes' : 'No';
}
