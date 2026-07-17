import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Flame, Loader2, RefreshCw, Search, AlertTriangle, Columns3 } from 'lucide-react';

import { selectIsAdmin, selectUser } from '@/features/auth/slices/authSlice';
import { useGetHotMetaLeadsQuery, useGetHotMetaLeadNotesMappingQuery } from '@/services';
import { SkeletonTable } from '@/shared/components/ui';

import HotLeadsGrid from './components/HotLeadsGrid';
import ManageCustomColumnsModal from './components/ManageCustomColumnsModal';

export default function ReportingPage() {
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);

  const {
    data: rows = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetHotMetaLeadsQuery(undefined, {
    pollingInterval: 10000,
    skipPollingIfUnfocused: true,
  });

  // Admin-defined custom column definitions (global). Shown as extra grid columns for every row.
  const { data: formFields = [] } = useGetHotMetaLeadNotesMappingQuery();

  const [search, setSearch] = useState('');
  const [columnsOpen, setColumnsOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      [r.name, r.phone, r.email, r.agent_name, r.campaign_name]
        .some((v) => (v || '').toString().toLowerCase().includes(q))
    );
  }, [rows, search]);

  const stats = useMemo(
    () => ({
      total: filtered.length,
      registered: filtered.filter((r) => r.client_registered === true).length,
      deposited: filtered.filter((r) => r.client_deposited === true).length,
    }),
    [filtered],
  );

  return (
    <div className="space-y-2 stagger-children">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-b from-card/70 to-card/40 px-4 py-2.5 transition-smooth">
        <div className="pointer-events-none absolute inset-0 opacity-60
          bg-[radial-gradient(700px_circle_at_0%_0%,hsl(var(--primary)/0.10),transparent_55%),
             radial-gradient(600px_circle_at_100%_100%,hsl(var(--destructive)/0.07),transparent_55%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg border border-primary/30 bg-primary/10 grid place-items-center shrink-0">
              <Flame className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground leading-none">
                Hot Meta Leads
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isAdmin
                  ? 'All hot leads — admin view'
                  : 'Your assigned & unclaimed leads'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatPill label="Total" value={stats.total} />
            <StatPill label="Registered" value={stats.registered} tone="active" />
            <StatPill label="Deposited" value={stats.deposited} tone="primary" />
            <div className="w-px h-4 bg-border mx-1" />
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, email…"
                className="w-56 rounded-md border border-input bg-input/40 pl-8 pr-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-smooth"
              />
            </div>
            {isAdmin && (
              <button
                onClick={() => setColumnsOpen(true)}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth"
                title="Manage custom columns"
              >
                <Columns3 className="w-3.5 h-3.5" />
                <span className="text-xs">Columns</span>
              </button>
            )}
            <button
              onClick={refetch}
              disabled={isFetching}
              className="h-7 w-7 grid place-items-center rounded-md border border-border bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            {isFetching && !isLoading && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> syncing
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main panel */}
      <div className="rounded-xl border border-border bg-card/60 overflow-hidden transition-smooth">
        {isError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-destructive animate-fade-in">
            <AlertTriangle className="w-8 h-8" />
            <p className="text-sm">Failed to load reporting data</p>
            <button
              onClick={refetch}
              className="text-xs underline text-destructive/80 hover:text-destructive transition-smooth"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={8} columns={8} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm animate-fade-in">
            {search ? 'No leads match your search.' : 'No leads found.'}
          </div>
        ) : (
          <HotLeadsGrid rows={filtered} currentUser={user} isAdmin={isAdmin} formFields={formFields} />
        )}
      </div>

      {isAdmin && columnsOpen && (
        <ManageCustomColumnsModal
          onClose={() => setColumnsOpen(false)}
          formFields={formFields}
        />
      )}
    </div>
  );
}

function StatPill({ label, value, tone = 'default' }) {
  const toneCls = {
    default: 'text-foreground',
    active: 'text-[hsl(var(--status-active))]',
    primary: 'text-primary',
  }[tone];

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/40 px-2.5 py-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-mono-nums font-semibold ${toneCls}`}>{value}</span>
    </span>
  );
}
