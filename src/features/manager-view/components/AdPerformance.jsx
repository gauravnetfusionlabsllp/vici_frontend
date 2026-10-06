import { useMemo, useState } from 'react';
import { Megaphone } from 'lucide-react';

import { AD_GROUPS, computeAdPerformance, fmtPct } from '../utils';
import { SectionCard } from './Section';

const COLS = [
  { key: 'leads', label: 'Leads Called', hint: 'Ad leads that got at least one call' },
  { key: 'spoke', label: 'Spoke', hint: 'A real conversation happened' },
  { key: 'reachRate', label: 'Reach %', hint: 'Spoke ÷ leads called', pct: true },
  { key: 'interested', label: 'Interested', hint: 'Agent marked interested', tone: 'text-primary' },
  { key: 'interestRate', label: 'Interest %', hint: 'Interested ÷ leads called', pct: true, tone: 'text-primary' },
  { key: 'callback', label: 'Callback', hint: 'Asked to be called back' },
  { key: 'notInterested', label: 'Not Int.', hint: 'Said no / do not call' },
  { key: 'noAnswer', label: 'No Pickup', hint: 'Never reached yet' },
  { key: 'invalid', label: 'Invalid No.', hint: 'Wrong or dead number', tone: 'text-destructive' },
  { key: 'accounts', label: 'Accounts', hint: 'Opened a trading account', tone: 'text-[hsl(var(--status-active))]' },
  { key: 'ftd', label: 'FTD', hint: 'Made a first deposit', tone: 'text-[hsl(var(--status-active))]' },
];

/**
 * Marketing's view of the same calls: what each campaign / ad set / ad / form produced.
 * A high "Invalid No." or low "Reach %" points at lead quality; a low "Interest %" at the ad's
 * message — the two questions marketing asks first.
 */
export default function AdPerformance({ data }) {
  const [group, setGroup] = useState(AD_GROUPS[0].key);
  const rows = useMemo(() => computeAdPerformance(data, group), [data, group]);
  const groupLabel = AD_GROUPS.find((g) => g.key === group)?.label;

  const toggle = (
    <div className="flex items-center gap-1">
      {AD_GROUPS.map((g) => (
        <button
          key={g.key}
          onClick={() => setGroup(g.key)}
          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide transition-smooth
            ${group === g.key ? 'bg-[hsl(var(--mv-head-fg)/0.25)]' : 'opacity-70 hover:opacity-100'}`}
        >
          {g.label}
        </button>
      ))}
    </div>
  );

  return (
    <SectionCard title="Ad Performance — what each ad's leads became" icon={Megaphone} right={toggle} bodyClass="p-0">
      {rows.length === 0 ? (
        <div className="py-6 text-center text-[11px] text-muted-foreground italic">No Meta leads were called in these dates</div>
      ) : (
        <div className="overflow-x-auto scrollbar-thin max-h-[360px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card">
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left font-medium py-2 px-3">{groupLabel}</th>
                {COLS.map((c) => (
                  <th key={c.key} className="text-right font-medium py-2 px-2 whitespace-nowrap cursor-help" title={c.hint}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono-nums">
              {rows.map((r) => (
                <tr key={r.name} className="border-t border-border/40 hover:bg-secondary/30">
                  <td className="py-1.5 px-3 font-sans text-foreground/90 max-w-[22rem] truncate" title={r.name}>{r.name}</td>
                  {COLS.map((c) => (
                    <td key={c.key} className={`py-1.5 px-2 text-right ${c.tone || 'text-foreground/80'}`}>
                      {c.pct ? fmtPct(r[c.key]) : r[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
