import { DISPOSITIONS } from '@/features/leads/constants';

const DISPOSITION_LABEL = DISPOSITIONS.reduce((acc, d) => {
  acc[d.value] = d.label;
  return acc;
}, {});

// Disposition code → tone bucket. Tones map to the project's status tokens.
const DISPOSITION_TONE = {
  CON:  'active',   // Converted
  IN:   'active',   // Interested
  CBR:  'primary',  // Callback
  C:    'neutral',  // Completed
  B:    'warn',     // Busy
  N:    'warn',     // No Answer
  NI:   'danger',   // Not Interested
  D:    'danger',   // Disconnected
  INVN: 'danger',   // Invalid Number
  WN:   'danger',   // Wrong Number
  FUC:  'primary',  // Follow Up
  INCALL: 'active', // In Call (internal-only status for live calls)
  NEW:  'muted',    // VICIdial's own "never dialed" status — not an agent's answer
};

const TONE_CLS = {
  active:  'text-[hsl(var(--status-active))]',
  warn:    'text-[hsl(var(--status-waiting))]',
  danger:  'text-destructive',
  primary: 'text-primary',
  neutral: 'text-foreground/80',
  muted:   'text-muted-foreground',
};

/**
 * VICIdial disposition code rendered as "<label> (<code>)", tinted by outcome.
 * Unknown codes still render — VICIdial statuses are configurable, so anything not in
 * DISPOSITIONS shows the raw code in the neutral tone rather than an empty cell.
 */
export default function DispositionBadge({ value }) {
  const code = (value ?? '').toString().trim().toUpperCase();
  if (!code) return <span className="text-xs text-muted-foreground">—</span>;

  const label = DISPOSITION_LABEL[code];
  const tone = DISPOSITION_TONE[code] ?? 'neutral';

  return (
    <span className={`text-xs ${TONE_CLS[tone]}`} title={label ? `${label} (${code})` : code}>
      {label ?? code}
      {label && <span className="ml-1 text-muted-foreground font-mono text-[10px]">({code})</span>}
    </span>
  );
}
