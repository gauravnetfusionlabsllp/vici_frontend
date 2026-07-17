import { fmtAmount, fmtPct } from '../utils';

const TONE = {
  default: 'text-foreground',
  primary: 'text-primary',
  active: 'text-[hsl(var(--status-active))]',
  warn: 'text-[hsl(var(--status-waiting))]',
  danger: 'text-destructive',
};

function Cell({ label, value, tone = 'default', alert = false }) {
  return (
    <div className={`px-3 py-2.5 flex flex-col gap-1 ${alert ? 'bg-destructive/5' : ''}`}>
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground leading-tight">{label}</span>
      <span className={`text-xl font-semibold font-mono-nums leading-none ${TONE[tone]}`}>{value}</span>
    </div>
  );
}

export default function KpiBand({ kpis }) {
  const cells = [
    { label: 'Total Leads', value: kpis.totalLeads, tone: 'primary' },
    { label: 'Assigned', value: kpis.assigned },
    { label: 'Unassigned', value: kpis.unassigned, tone: kpis.unassigned > 0 ? 'danger' : 'default', alert: kpis.unassigned > 0 },
    { label: 'Disposition Updated', value: kpis.dispositionUpdated },
    { label: 'Interested', value: kpis.interested, tone: 'primary' },
    { label: 'Callbacks', value: kpis.callbacks, tone: 'warn' },
    { label: 'Accounts Opened', value: kpis.accountsOpened, tone: 'active' },
    { label: 'KYC Complete', value: kpis.kycComplete, tone: 'active' },
    { label: 'FTD Received', value: kpis.ftdReceived, tone: 'active' },
    { label: 'Total FTD Amount', value: fmtAmount(kpis.totalFtdAmount) },
    { label: 'Redeposit Amount', value: fmtAmount(kpis.redepositAmount) },
    { label: 'RNR', value: kpis.rnr, tone: 'warn' },
    { label: 'Invalid Numbers', value: kpis.invalidNumbers, tone: 'danger' },
    { label: 'WhatsApp Preference', value: kpis.whatsappPreference },
    { label: 'Sales Update Completion', value: fmtPct(kpis.salesUpdateCompletion), tone: 'primary' },
    { label: 'Total Calls', value: kpis.totalCalls },
    { label: 'Avg Rating', value: `${kpis.avgRating}/10`, tone: 'warn' },
    { label: 'Avg Stars', value: `${kpis.avgStars}/5`, tone: 'warn' },
  ];

  return (
    <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y divide-border/60">
        {cells.map((c) => (
          <Cell key={c.label} {...c} />
        ))}
      </div>
    </div>
  );
}
