import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Loader2, MessageSquare, Search, X } from 'lucide-react';

import { selectMaskPii } from '@/features/auth/slices/authSlice';
import { maskPhone } from '@/shared/lib/mask';
import { useGetDoubleTickConversationsQuery } from '@/services';

const PAGE = 50;

const fmtWhen = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

function Tag({ children }) {
  return (
    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground whitespace-nowrap">
      {children}
    </span>
  );
}

/**
 * Every conversation, searchable and filterable. Rows open the full thread.
 */
export default function ConversationsTable({ sd, ed, agents = [], onOpen }) {
  const maskPii = useSelector(selectMaskPii);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [agent, setAgent] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [allDates, setAllDates] = useState(false);

  // Debounce typing so each keystroke isn't a request.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Any filter change invalidates the page position. Deriving the offset from a
  // filter fingerprint resets it without an effect, so there's no cascading render.
  const filterKey = `${sd}|${ed}|${allDates}|${search}|${agent}|${unreadOnly}`;
  const [page, setPage] = useState({ key: filterKey, offset: 0 });
  const offset = page.key === filterKey ? page.offset : 0;
  const goto = (next) => setPage({ key: filterKey, offset: Math.max(0, next) });

  const { data, isFetching } = useGetDoubleTickConversationsQuery({
    // "All dates" lets you find a contact whose last message falls outside the
    // dashboard's range — otherwise searching them returns nothing, which reads
    // like the contact doesn't exist.
    sd: allDates ? undefined : sd,
    ed: allDates ? undefined : ed,
    search: search || undefined,
    agent: agent || undefined,
    unread_only: unreadOnly || undefined,
    limit: PAGE,
    offset,
  });

  const rows = data?.conversations ?? [];
  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + PAGE, total);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-3.5 pt-3 pb-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
          All conversations
        </h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Click any row to read the whole chat — what the customer wrote and what your team replied.
          {allDates
            ? ' Showing every conversation on record.'
            : ' Showing conversations active in the selected dates.'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3.5 pb-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or phone…"
            aria-label="Search conversations"
            className="h-8 w-56 rounded-md border border-border bg-background pl-7 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <select
          value={agent}
          onChange={(e) => setAgent(e.target.value)}
          aria-label="Filter by team member"
          className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Everyone</option>
          {agents.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="accent-[hsl(var(--primary))]"
          />
          Unread only
        </label>

        <label
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer"
          title="Search the whole history instead of just the selected dates"
        >
          <input
            type="checkbox"
            checked={allDates}
            onChange={(e) => setAllDates(e.target.checked)}
            className="accent-[hsl(var(--primary))]"
          />
          Ignore dates
        </label>

        <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums">
          {isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
          {from}–{to} of {total.toLocaleString()}
        </span>
      </div>

      {/* Rows — held at reduced opacity while refetching, so there's no skeleton flash. */}
      <div className={`overflow-auto scrollbar-thin max-h-[520px] transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 px-3 text-left font-medium">Contact</th>
              <th className="py-2 px-3 text-left font-medium">Phone</th>
              <th className="py-2 px-3 text-left font-medium">Handled by</th>
              <th className="py-2 px-3 text-left font-medium">Labels</th>
              <th className="py-2 px-3 text-left font-medium">Last message</th>
              <th className="py-2 px-3 text-right font-medium">Msgs</th>
              <th className="py-2 px-3 text-right font-medium">Unread</th>
              <th className="py-2 px-3 text-left font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !isFetching && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-xs italic text-muted-foreground">
                  No conversations match those filters.
                </td>
              </tr>
            )}

            {rows.map((r, i) => (
              <tr
                key={`${r.waba_number}-${r.phone_number}-${i}`}
                onClick={() => onOpen(r)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(r))}
                tabIndex={0}
                role="button"
                aria-label={`Open conversation with ${r.name || r.phone_number}`}
                className="cursor-pointer border-b border-border/50 last:border-0 hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
              >
                <td className="py-2 px-3 font-medium text-foreground whitespace-nowrap">{r.name || '—'}</td>
                <td className="py-2 px-3 text-muted-foreground tabular-nums whitespace-nowrap">
                  {maskPii ? maskPhone(r.phone_number) : (r.phone_number || '—')}
                </td>
                <td className="py-2 px-3 whitespace-nowrap">
                  {r.assigned_user_name
                    ? <span className="text-foreground">{r.assigned_user_name}</span>
                    : <span className="italic text-muted-foreground">Unassigned</span>}
                </td>
                <td className="py-2 px-3">
                  <div className="flex flex-wrap gap-1">
                    {(r.tag_names ?? []).length
                      ? r.tag_names.map((t) => <Tag key={t}>{t}</Tag>)
                      : <span className="text-muted-foreground">—</span>}
                  </div>
                </td>
                <td className="py-2 px-3 text-muted-foreground max-w-[260px]">
                  <span className="block truncate" title={r.last_text || ''}>{r.last_text || '—'}</span>
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">{r.message_count}</td>
                <td className="py-2 px-3 text-right tabular-nums">
                  {r.unread_count > 0
                    ? <span className="font-semibold text-foreground">{r.unread_count}</span>
                    : <span className="text-muted-foreground">0</span>}
                </td>
                <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">{fmtWhen(r.last_message_time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pager */}
      {total > PAGE && (
        <div className="flex items-center justify-between gap-2 border-t border-border px-3.5 py-2">
          <button
            type="button"
            onClick={() => goto(offset - PAGE)}
            disabled={offset === 0}
            className="rounded-md border border-border px-2.5 py-1 text-[11px] text-foreground disabled:opacity-40 hover:bg-muted"
          >
            Previous
          </button>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            Page {Math.floor(offset / PAGE) + 1} of {Math.max(1, Math.ceil(total / PAGE))}
          </span>
          <button
            type="button"
            onClick={() => goto(offset + PAGE < total ? offset + PAGE : offset)}
            disabled={offset + PAGE >= total}
            className="rounded-md border border-border px-2.5 py-1 text-[11px] text-foreground disabled:opacity-40 hover:bg-muted"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
