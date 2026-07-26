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
