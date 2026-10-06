import { useMemo, useState } from 'react';
import {
  Link2, Link2Off, Loader2, RefreshCw, Search, Users, AlertTriangle, CheckCircle2,
} from 'lucide-react';

import {
  useGetStringeeAgentsQuery,
  useBulkLinkStringeeAgentsMutation,
} from '@/services';
import { useToast } from '@/shared/hooks/useToast';
import { apiError, fmtDateTime } from './utils';

// Stable identity, so `data?.x ?? EMPTY` doesn't hand useMemo a fresh array
// on every render and defeat the memoization below.
const EMPTY = [];

const FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'linked',   label: 'Linked' },
  { key: 'unlinked', label: 'Not linked' },
];

function StatTile({ icon: Icon, label, value, tone = 'default' }) {
  const toneCls = {
    default: 'text-foreground',
    emerald: 'text-emerald-400',
    amber:   'text-amber-400',
    slate:   'text-slate-400',
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${toneCls}`}>{value}</div>
    </div>
  );
}

export default function StringeeAgentsPage() {
  const { success, error: toastError } = useToast();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetStringeeAgentsQuery();
  const [bulkLink, { isLoading: isSaving }] = useBulkLinkStringeeAgentsMutation();

  // agent_user -> stringee_user_id, only for rows the admin has touched.
  const [draft, setDraft]   = useState({});
  const [query, setQuery]   = useState('');
  const [filter, setFilter] = useState('all');

  const stringeeAgents = data?.stringeeAgents ?? EMPTY;
  const mappings       = data?.mappings ?? EMPTY;
  const viciAgents     = data?.viciAgents ?? EMPTY;

  const linkOf = useMemo(
    () => new Map(mappings.map((m) => [m.agent_user, m])),
    [mappings],
  );

  // Which StringeeX agent is already spoken for, and by whom. The server
  // rejects a duplicate claim; this stops the admin building one at all.
  const claimedBy = useMemo(() => {
    const m = new Map(
      mappings.filter((x) => x.stringee_user_id).map((x) => [x.stringee_user_id, x.agent_user]),
    );
    // Staged edits count as claims too, so two rows can't stage the same id.
    Object.entries(draft).forEach(([user, sid]) => {
      if (sid) m.set(sid, user);
    });
    return m;
  }, [mappings, draft]);

  // agent_user -> the id that WOULD be saved right now: the staged edit if the
  // admin touched this row, otherwise what is already stored. Derived once so
  // nothing downstream has to re-apply the draft-over-saved rule.
  const effective = useMemo(() => {
    const m = new Map();
    viciAgents.forEach((a) => {
      const saved = linkOf.get(a.user)?.stringee_user_id ?? '';
      m.set(a.user, draft[a.user] !== undefined ? draft[a.user] : saved);
    });
    return m;
  }, [viciAgents, linkOf, draft]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return viciAgents.filter((a) => {
      const linked = !!effective.get(a.user);
      if (filter === 'linked' && !linked) return false;
      if (filter === 'unlinked' && linked) return false;
      if (!q) return true;
      return a.user.toLowerCase().includes(q) || (a.full_name || '').toLowerCase().includes(q);
    });
  }, [viciAgents, query, filter, effective]);

  const linkedCount = useMemo(
    () => viciAgents.filter((a) => !!effective.get(a.user)).length,
    [viciAgents, effective],
  );
  const unclaimedCount = stringeeAgents.filter((s) => !claimedBy.has(s.stringee_user_id)).length;
  const dirty = Object.entries(draft).filter(
    ([user, sid]) => sid !== (linkOf.get(user)?.stringee_user_id ?? ''),
  );

  const onPick = (user, sid) =>
    setDraft((d) => ({ ...d, [user]: sid }));

  const onSave = async () => {
    // The bulk route rejects an empty stringee_user_id, so only real links go.
    const links = dirty
      .filter(([, sid]) => sid)
      .map(([agent_user, stringee_user_id]) => ({ agent_user, stringee_user_id }));
    if (!links.length) return;
    try {
      await bulkLink(links).unwrap();
      success(`Linked ${links.length} agent${links.length > 1 ? 's' : ''}`);
      setDraft({});
    } catch (e) {
      toastError(apiError(e, 'Nothing was saved'));
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-[1200px] space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">Agent Mapping</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Link each VICIdial agent to their StringeeX agent. An agent with no link
            cannot dial Indian (+91) numbers.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon={Users}         label="VICIdial agents"    value={viciAgents.length} />
          <StatTile icon={CheckCircle2}  label="Linked"             value={linkedCount} tone="emerald" />
          <StatTile icon={AlertTriangle} label="Not linked"         value={viciAgents.length - linkedCount} tone="amber" />
          <StatTile icon={Link2}         label="Free StringeeX IDs" value={unclaimedCount} tone="slate" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search agent or name…"
              className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-500/60"
            />
          </div>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                filter === f.key
                  ? 'border-sky-500/60 bg-sky-500/10 text-sky-300'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={refetch}
            disabled={isFetching}
            className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isError && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {apiError(error, 'Could not load the mapping.')}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">VICIdial agent</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">StringeeX agent</th>
                <th className="px-4 py-3 text-left">Updated</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td></tr>
              )}

              {!isLoading && !rows.length && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  No agents match.
                </td></tr>
              )}

              {rows.map((a) => {
                const current = effective.get(a.user) ?? '';
                const saved   = linkOf.get(a.user)?.stringee_user_id ?? '';
                const changed = current !== saved;
                // Offer ids nobody else holds, plus this row's own.
                const options = stringeeAgents.filter(
                  (s) => !claimedBy.has(s.stringee_user_id) || claimedBy.get(s.stringee_user_id) === a.user,
                );
                return (
                  <tr
                    key={a.user}
                    className={`border-t border-border/60 ${changed ? 'bg-sky-500/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono">{a.user}</div>
                      <div className="text-xs text-muted-foreground">
                        {a.full_name || '—'}
                        {a.user_group ? ` · ${a.user_group}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {current ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
                          <Link2 className="h-3 w-3" /> Linked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-400">
                          <Link2Off className="h-3 w-3" /> Not linked
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={current}
                        onChange={(e) => onPick(a.user, e.target.value)}
                        className="w-full max-w-[280px] rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-sky-500/60"
                      >
                        <option value="">— Not linked —</option>
                        {options.map((s) => (
                          <option key={s.stringee_user_id} value={s.stringee_user_id}>
                            {s.name} ({s.stringee_user_id})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {fmtDateTime(linkOf.get(a.user)?.updated_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!!dirty.length && (
          <div className="sticky bottom-4 flex items-center justify-between rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 backdrop-blur">
            <span className="text-sm text-sky-200">
              {dirty.length} unsaved change{dirty.length > 1 ? 's' : ''}
              {dirty.some(([, sid]) => !sid) && ' · clearing a link is not supported yet'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setDraft({})}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm hover:text-foreground"
              >
                Discard
              </button>
              <button
                onClick={onSave}
                disabled={isSaving || !dirty.some(([, sid]) => sid)}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
