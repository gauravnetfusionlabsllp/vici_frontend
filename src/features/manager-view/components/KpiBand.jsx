import { fmtAmount, fmtPct } from '../utils';

const TONE = {
  default: 'text-foreground',
  primary: 'text-primary',
  active: 'text-[hsl(var(--status-active))]',
  warn: 'text-[hsl(var(--status-waiting))]',
  danger: 'text-destructive',
};

// Every number carries a one-line explanation, so the marketing team never has to ask what
// a tile counts. Lead tiles count each Meta lead once, however many times it was called.
function Cell({ label, value, hint, tone = 'default', alert = false }) {
  return (
    <div className={`px-3 py-2.5 flex flex-col gap-1 ${alert ? 'bg-destructive/5' : ''}`} title={hint}>
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground leading-tight">{label}</span>
      <span className={`text-xl font-semibold font-mono-nums leading-none ${TONE[tone]}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground/80 leading-snug">{hint}</span>
    </div>
  );
}

export default function KpiBand({ kpis }) {
  const cells = [
    { label: 'Meta Leads Called', value: kpis.totalLeads, tone: 'primary', hint: 'Ad leads that got at least one call in these dates' },
    { label: 'Spoke with Client', value: kpis.spoke, tone: 'active', hint: 'A real conversation happened on a call' },
    { label: 'Interested', value: kpis.interested, tone: 'primary', hint: 'Agent marked the client as interested' },
    { label: 'Not Interested', value: kpis.notInterested, hint: 'Client said no / do not call' },
    { label: 'Callback Promised', value: kpis.callbacks, tone: 'warn', hint: 'Client asked to be called back' },
    { label: 'Did Not Pick Up', value: kpis.rnr, tone: 'warn', hint: 'Busy / no answer, never reached yet' },
    { label: 'Invalid Numbers', value: kpis.invalidNumbers, tone: 'danger', hint: 'Wrong, invalid or disconnected number' },
    { label: 'Accounts Opened', value: kpis.accountsOpened, tone: 'active', hint: 'Client registered a trading account' },
    { label: 'KYC Complete', value: kpis.kycComplete, tone: 'active', hint: 'Client finished identity verification' },
    { label: 'FTD Received', value: kpis.ftdReceived, tone: 'active', hint: 'Client made their first deposit' },
    { label: 'Total FTD Amount', value: fmtAmount(kpis.totalFtdAmount), hint: 'Sum of first deposits agents recorded' },
    { label: 'Redeposit Amount', value: fmtAmount(kpis.redepositAmount), hint: 'Sum of later deposits agents recorded' },
    { label: 'Owned by an Agent', value: kpis.assigned, hint: 'Lead has an agent responsible for it' },
    { label: 'No Agent Owner', value: kpis.unassigned, tone: kpis.unassigned > 0 ? 'danger' : 'default', alert: kpis.unassigned > 0, hint: 'Nobody is responsible for these leads' },
    { label: 'Result Saved', value: kpis.dispositionUpdated, hint: 'Agent recorded how the call went' },
    { label: 'Prefer WhatsApp', value: kpis.whatsappPreference, hint: 'Client was contacted on WhatsApp' },
    { label: 'Sales Update Completion', value: fmtPct(kpis.salesUpdateCompletion), tone: 'primary', hint: 'How fully agents filled in lead details' },
    { label: 'Total Calls', value: kpis.totalCalls, hint: 'Every call made in these dates' },
    { label: 'Avg Call Rating', value: `${kpis.avgRating}/10`, tone: 'warn', hint: 'AI score of the agent’s calls' },
    { label: 'Avg Stars', value: `${kpis.avgStars}/5`, tone: 'warn', hint: 'Same score, out of 5 stars' },
  ];

  return (
    <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y divide-border/60">
        {cells.map((c) => (
          <Cell key={c.label} {...c} />
        ))}
      </div>
    </div>
  );
}
