import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, CheckCheck, Inbox, Loader2, Mail, MessageCircle, MessagesSquare,
  Moon, RefreshCw, Sun, Tag, Users2, Wallet,
} from 'lucide-react';

import { useGetDoubleTickOverviewQuery, useSyncDoubleTickMutation } from '@/services';
import { useToast } from '@/shared/hooks/useToast';

import { DtThemeContext, DT_THEME_KEY, readInitialTheme } from './theme';
import ActivityChart from './components/ActivityChart';
import BreakdownBar from './components/BreakdownBar';
import ChartCard from './components/ChartCard';
import ConversationDrawer from './components/ConversationDrawer';
import ConversationsTable from './components/ConversationsTable';
import DateRangeFilter from './components/DateRangeFilter';
import { presetRanges } from './dateRange';
import StatTile from './components/StatTile';

const num = (v) => (v == null ? '—' : Number(v).toLocaleString());

const money = (v, ccy) =>
  v == null ? '—' : `${ccy ? `${ccy} ` : ''}${Number(v).toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;

/** Human wording for message types, so the chart doesn't speak in API vocabulary. */
const TYPE_LABEL = {
  text: 'Typed message', template: 'Template blast', system: 'System event',
  button: 'Button tap', image: 'Photo', audio: 'Voice note', video: 'Video',
  document: 'Document', sticker: 'Sticker', contacts: 'Shared contact',
  unsupported: 'Unsupported', location: 'Location', order: 'Order',
};

function ThemeToggle({ theme, onToggle }) {
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle light or dark mode"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors"
    >
      {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      <span className="text-xs">{dark ? 'Light' : 'Dark'}</span>
    </button>
  );
}

export default function DoubleTickPage() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [theme, setTheme] = useState(readInitialTheme);
  // Default to the last 30 days; the calendar and presets both write here, and every
  // query on the page reads from it.
  const [range, setRange] = useState(() => {
    const p = presetRanges().find((r) => r.label === 'Last 30 days');
    return { sd: p.sd, ed: p.ed };
  });
  const [openChat, setOpenChat] = useState(null);

  useEffect(() => {
    try { localStorage.setItem(DT_THEME_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetDoubleTickOverviewQuery(range);
  const [runSync, syncState] = useSyncDoubleTickMutation();

  useEffect(() => {
    if (isError) {
      const detail = error?.data?.detail || error?.error || 'Could not load DoubleTick data';
      toastError(String(detail));
    }
  }, [isError, error, toastError]);

  const k = data?.kpis ?? {};

  // Drop the empty lead-in days. The API gap-fills the whole window so quiet days read
  // as zero, but a long flat run before the first message just squeezes the real trend
  // into the right-hand third of the plot. Interior zero days are kept.
  const activity = useMemo(() => {
    const rows = data?.activity_by_day ?? [];
    const first = rows.findIndex((d) => d.customer || d.agent || d.system);
    return (first <= 0 ? rows : rows.slice(first)).map((d) => ({ ...d, full: d.day }));
  }, [data]);

  const agents = useMemo(
    () => (data?.chats_by_agent ?? []).map((a) => ({ name: a.name, value: a.chats })),
    [data],
  );

  // Feeds the conversation filter dropdown.
  const agentNames = useMemo(() => agents.map((a) => a.name), [agents]);

  // Labels are the reader's vocabulary, not the API's; keep the raw key for the table.
  const types = useMemo(
    () => (data?.message_types ?? []).map((t) => ({
      name: TYPE_LABEL[t.type] ?? t.type, raw: t.type, value: t.messages,
    })),
    [data],
  );

  const tags = useMemo(
    () => (data?.tags ?? []).map((t) => ({ name: t.tag, value: t.chats })),
    [data],
  );

  const lastSync = useMemo(() => {
    const runs = data?.last_sync ?? [];
    if (!runs.length) return null;
    const newest = runs.reduce((a, b) => (a.finished_at > b.finished_at ? a : b));
    return { at: newest.finished_at, failed: runs.filter((r) => r.status !== 'OK') };
  }, [data]);

  const handleSync = async () => {
    try {
      await runSync().unwrap();
      toastSuccess('Synced with DoubleTick');
    } catch (e) {
      toastError(String(e?.data?.detail || 'Sync failed'));
    }
  };

  const syncing = syncState.isLoading;

  return (
    <DtThemeContext.Provider value={theme}>
      <div className="dt-scope rounded-xl bg-background text-foreground p-3 md:p-4" data-theme={theme}>
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-lg font-semibold leading-tight">
              <MessageCircle className="w-5 h-5 text-primary shrink-0" />
              DoubleTick — WhatsApp overview
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              How many people you're talking to on WhatsApp, who's handling them, and what's being said.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isFetching && !isLoading && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> refreshing
              </span>
            )}
            <ThemeToggle theme={theme} onToggle={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))} />
            <button
              type="button"
              onClick={refetch}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors"
              title="Reload from the database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="text-xs">Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
              title="Fetch the newest data from DoubleTick (takes a few minutes)"
            >
              {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span className="text-xs">{syncing ? 'Syncing…' : 'Sync now'}</span>
            </button>
          </div>
        </div>

        {/* ── One filter row, above everything it scopes ────────────── */}
        <DateRangeFilter
          sd={range.sd}
          ed={range.ed}
          onChange={setRange}
          right={
            <span className="text-[11px] text-muted-foreground">
              {lastSync?.at
                ? <>Data last pulled from DoubleTick: {new Date(lastSync.at).toLocaleString()}</>
                : 'Not synced yet'}
            </span>
          }
        />

        {lastSync?.failed?.length > 0 && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-foreground">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <span>
              Last sync had problems with: {lastSync.failed.map((f) => f.resource).join(', ')}. The
              numbers below may be out of date for those parts.
            </span>
          </div>
        )}

        {/* ── Headline numbers ─────────────────────────────────────── */}
        <div className="grid gap-2.5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-2.5">
          <StatTile
            icon={Users2} label="People reached" value={num(k.chats_in_range)} loading={isLoading}
            hint={`Contacts you exchanged messages with in this period. ${num(k.chats_all_time)} all time.`}
          />
          <StatTile
            icon={MessagesSquare} label="Messages" value={num(k.messages_in_range)} loading={isLoading}
            hint={`Sent and received in this period. ${num(k.messages_all_time)} all time.`}
          />
          <StatTile
            icon={Inbox} label="Waiting for reply" value={num(k.unread_messages)} loading={isLoading}
            hint={`Unread in this period's conversations. ${num(k.unread_all_time)} unread across the whole inbox.`}
          />
          <StatTile
            icon={CheckCheck} label="Open conversations" value={num(k.chats_open)} loading={isLoading}
            hint={`Still open from this period; ${num(k.chats_done)} marked done.`}
          />
          {/* The last two have no history stored, so the date range cannot apply to
              them — the badge says so rather than implying they moved. */}
          <StatTile
            icon={Mail} label="Approved templates" value={num(k.templates_approved)} loading={isLoading}
            badge="now"
            hint={`${num(k.templates_total)} created in total; the rest were rejected or are pending.`}
          />
          <StatTile
            icon={Wallet} label="Wallet balance"
            value={money(k.wallet_balance, k.wallet_currency)} loading={isLoading}
            badge="now"
            hint="Credit left for sending WhatsApp messages."
          />
        </div>

        {/* ── Charts ───────────────────────────────────────────────── */}
        <div className="grid gap-2.5 grid-cols-1 xl:grid-cols-3 mb-2.5">
          <div className="xl:col-span-2">
            <ChartCard
              title="Conversation activity, day by day"
              explain="Blue is what customers sent you; green is what your team sent back. When blue runs above green, people are waiting on a reply."
              icon={MessagesSquare}
              height={260}
              rows={activity}
              columns={[
                { key: 'day', label: 'Date' },
                { key: 'customer', label: 'From customers', align: 'right' },
                { key: 'agent', label: 'From your team', align: 'right' },
                { key: 'system', label: 'System events', align: 'right' },
              ]}
              empty="No messages in this period"
            >
              <ActivityChart data={activity} />
            </ChartCard>
          </div>

          <ChartCard
            title="Who's handling conversations"
            explain="Number of chats assigned to each team member. A large 'Unassigned' bar means chats nobody owns."
            icon={Users2}
            height={260}
            rows={agents}
            columns={[
              { key: 'name', label: 'Team member' },
              { key: 'value', label: 'Conversations', align: 'right' },
            ]}
            empty="Nobody assigned yet"
          >
            <BreakdownBar data={agents} unit="Conversations" />
          </ChartCard>
        </div>

        <div className="grid gap-2.5 grid-cols-1 xl:grid-cols-2 mb-2.5">
          <ChartCard
            title="Where conversations stand"
            explain="Labels your team puts on a chat — how far each contact has moved, from a fresh click-to-WhatsApp lead through to a first deposit."
            icon={Tag}
            height={280}
            rows={tags}
            columns={[
              { key: 'name', label: 'Label' },
              { key: 'value', label: 'Conversations', align: 'right' },
            ]}
            empty="No labels used yet"
          >
            <BreakdownBar data={tags} unit="Conversations" />
          </ChartCard>

          <ChartCard
            title="What kind of messages"
            explain="The mix of message types in this period — typed replies, template blasts, photos, voice notes and automatic system events."
            icon={MessageCircle}
            height={280}
            rows={types}
            columns={[
              { key: 'name', label: 'Type' },
              { key: 'value', label: 'Messages', align: 'right' },
            ]}
            empty="No messages in this period"
          >
            <BreakdownBar data={types} unit="Messages" />
          </ChartCard>
        </div>

        {/* ── The people behind the numbers ────────────────────────── */}
        <ConversationsTable sd={range.sd} ed={range.ed} agents={agentNames} onOpen={setOpenChat} />

        {openChat && (
          <ConversationDrawer chat={openChat} theme={theme} onClose={() => setOpenChat(null)} />
        )}
      </div>
    </DtThemeContext.Provider>
  );
}
