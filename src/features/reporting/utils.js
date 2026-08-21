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
// IB is the VICIdial list the lead was routed into — list 7022026 is the IB team's,
// 971585658633 is everyone else's — so only the server can answer it, and every row that
// carries an IB column arrives with an `is_ib` boolean on it (api/services/vicidial.py,
// resolve_ib). The grids just render that flag.
//
// It used to be derived here from the Meta form answer, which called a lead non-IB
// whenever the IB came from the form/campaign name ("…-ib") or the landing page's
// "interest": "ib" rather than a form question — so every SGFX_Landing lead from a
// tesla-*-ib campaign sat in the IB list while this column said No.

// Grid-friendly 'Yes' / 'No' / '' so sorting, filtering and export all work off plain text.
export function ibLabel(isIb) {
  return isIb === null || isIb === undefined ? '' : isIb ? 'Yes' : 'No';
}
