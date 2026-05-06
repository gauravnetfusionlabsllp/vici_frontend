# Project Map — VICIdial Frontend

> React 19 · Vite · Redux Toolkit + RTK Query · Tailwind CSS · ag-Grid · Bulletproof-React layout

---

## Top-level layout

```
src/
├── main.jsx          Vite entry — wraps <App /> in <VicidialPopupProvider>
├── index.css         Global Tailwind base styles
├── app/              App shell (App, Layout, store, route guards)
├── features/         Self-contained domain modules (page + components + slices)
├── pages/            Standalone routes that don't belong to any feature
├── services/         RTK Query API layer (api + baseQuery + endpoints barrel)
└── shared/           Cross-feature reusables (components, hooks, context, lib)
```

Path alias: `@/*` → `src/*` (configured in `vite.config.js`).

---

## Routing Overview

| Path | Page | Access | File |
|------|------|--------|------|
| `/login` | LoginPage | Public | `src/features/auth/LoginPage.jsx` |
| `/` | DashboardPage | Admin only | `src/features/dashboard/DashboardPage.jsx` |
| `/selective` | SelectivePage | Admin only | `src/pages/SelectivePage.jsx` |
| `/leads-upload` | LeadsUploadPage | Admin only | `src/features/leads/LeadsUploadPage.jsx` |
| `/email-templates` | EmailTemplatesPage | Admin only | `src/features/email-templates/EmailTemplatesPage.jsx` |
| `/campaign-leads` | CampaignLeadsPage | Admin only | `src/features/campaign-leads/CampaignLeadsPage.jsx` |
| `/call` | CallPage | Agent only | `src/features/calls/CallPage.jsx` |
| `/unauthorized` | UnauthorizedPage | Any | `src/features/auth/UnauthorizedPage.jsx` |
| `*` | NotFoundPage | Any | `src/pages/NotFoundPage.jsx` |

---

## src/app/ — App shell

```
src/app/
├── App.jsx              Provider + BrowserRouter + Layout + all route definitions
├── Layout.jsx           Renders <TopNav> + <Toaster> around page content
├── store.js             configureStore — slice reducers from features + RTK Query middleware
└── routes/
    ├── PrivateRoute.jsx Auth + role guard (allowedAdmin prop)
    └── PublicRoute.jsx  Redirects logged-in users away from /login
```

---

## src/features/ — Domain features

Each feature is self-contained: page entry at the root, sub-components in `components/`, Redux slices in `slices/`, helpers in `utils.js`/`utils.jsx`/`constants.js`.

### features/auth/

```
src/features/auth/
├── LoginPage.jsx                Vicidial login form (admin/agent role + campaign select)
├── UnauthorizedPage.jsx         403 page
├── components/
│   └── SessionPopup.jsx         Session-expiry modal (mounted globally in App.jsx)
└── slices/
    ├── authSlice.js             user, isAdmin, campaign, username
    └── sessionSlice.js          Session expiry state (drives SessionPopup)
```

### features/dashboard/

```
src/features/dashboard/
├── DashboardPage.jsx            Main dashboard layout — composes all the cards/charts below
├── components/
│   ├── AgentsTable.jsx          ag-Grid table — agent status, calls, talk time (filters by username)
│   ├── CampaignPerformance.jsx  ag-Grid table — campaign dial/connection stats (filters by campaign)
│   ├── CallStatusChart.jsx      Recharts donut — READY/INCALL/PAUSED distribution
│   ├── CallsAgentsOverview.jsx  8-card overview grid — active users, ringing, IVR, agent states
│   ├── ComplianceStats.jsx      DND violations, callback SLA, dial method, risk level cards
│   ├── DialerPerformance.jsx    Radial gauge + sparklines — dial level, drop rate, connection rate
│   ├── HourlyPerformance.jsx    ECharts heatmap — hourly call breakdown by type
│   ├── LeadFunnel.jsx           Trapezoid funnel — dialed → connected → interested → converted
│   ├── OverviewCard.jsx         Single KPI card with sparkline (used by TotalDialsToday)
│   ├── SparkLineChart.jsx       Recharts area sparkline sub-component (used by OverviewCard)
│   └── UtilizationChart.jsx     Recharts horizontal bar — Active/Ringing/Paused agent distribution
└── slices/
    ├── dateFilterSlice.js                 { from, to } date range used by date-filtered queries
    └── campaignAndUsernameFilterSlice.js  campaignId + username filters for ag-Grid drill-downs
```

### features/calls/

```
src/features/calls/
├── CallPage.jsx                  Agent call screen — TotalDialsToday + ContactDetails + leads/callback panels
├── components/
│   ├── ContactDetails.jsx        Lead info panel + END CALL button + manual dial input
│   ├── AgentLeadsPanel.jsx       Scrollable lead list with form_name filter (HotMetal campaign)
│   ├── CallbackListPanel.jsx     Scheduled callbacks list — callback time + dial button
│   ├── AgentTimelineChart.jsx    ApexCharts range bar — agent active/break sessions today
│   └── CallDispositionPopup.jsx  Post-call modal — status picker, callback datetime, SMS/WhatsApp
└── slices/
    ├── callSlice.js              callState FSM, showDispo, isCallbackDial
    └── dialSlice.js              currentLead, isPaused, autoDialTime, formNameFilter
```

### features/leads/

```
src/features/leads/
├── LeadsUploadPage.jsx           ag-Grid table + Excel upload + lead deletion
├── constants.js                  DISPOSITIONS array
└── components/
    ├── CallCellRenderer.jsx      ag-Grid cell: phone icon button
    ├── DeleteCellRenderer.jsx    ag-Grid cell: delete icon button → ConfirmDeletePopup
    └── StatusRenderer.jsx        ag-Grid cell: colored status badge
```

### features/email-templates/

```
src/features/email-templates/
├── EmailTemplatesPage.jsx        Tab switcher (Templates / Attachments)
├── utils.jsx                     getFileIcon() (returns JSX — must be .jsx) + inputCls constant
└── components/
    ├── TemplatesTab.jsx          Template list + create/edit controls
    ├── AttachmentsTab.jsx        Attachment list + upload controls
    ├── TemplateCard.jsx          Single template card with edit/delete actions
    ├── TemplateForm.jsx          Create/edit form
    ├── AttachmentPicker.jsx      File picker for template attachments
    ├── Field.jsx                 Labeled form field wrapper
    └── Modal.jsx                 Generic modal shell
```

### features/campaign-leads/

```
src/features/campaign-leads/
├── CampaignLeadsPage.jsx         Lead routing rules — list, filter tabs, create, sync, toggle active
├── utils.js                      fmtDate(), routeStatus(), STATUS_CFG, FILTERS
└── components/
    ├── StatusBadge.jsx           Colored route-status badge (live/bounded/scheduled/expired/paused)
    ├── ConditionChip.jsx         Filter condition display chip (src/form/from/until)
    ├── StatCard.jsx              Summary stat card for the top strip
    ├── LeadCard.jsx              Single routing rule card with toggle + sync action
    ├── SyncDrawer.jsx            Right-side drawer for syncing one rule with optional date range
    ├── CreateRuleModal.jsx       3-step wizard (Date Range → Filters → Destination) + ConfirmCreateModal
    │                             Internal helpers (StepRail, MultiSelectDropdown, ConfirmCreateModal)
    │                             live in the same file — they are wizard-only.
    ├── LoadingSkeleton.jsx       Skeleton loader grid
    └── EmptyState.jsx            Empty state illustration + CTA
```

---

## src/pages/ — Standalone routes (no feature home)

```
src/pages/
├── SelectivePage.jsx    Admin-only minimal screen — TotalDialsToday + AgentsTable
└── NotFoundPage.jsx     Catch-all 404 route
```

---

## src/services/ — RTK Query API layer

```
src/services/
├── api.js               createApi shell with tagTypes (no endpoints) — exports `dashboardApi`
├── baseQuery.js         fetchBaseQuery + baseQueryWithSession interceptor
│                        (JWT attach, withDate/withCampaign/withUsername param injection, 401 → showSessionPopup)
├── index.js             Barrel — re-exports `dashboardApi` + `setSessionExpired`/`getSessionExpired` + every hook
└── endpoints/
    ├── auth.js          useLoginMutation, useRefreshMutation, useGetCampaignsQuery
    ├── dashboard.js     11 analytics queries (totalDials, callStatus, agentsProductivity, campaignPerformance, ...)
    ├── calls.js         dialNext, callHangup, getLogData, submitStatus, ping, userTimeline, statusData, sendMessage
    ├── leads.js         uploadExcelLeads, getLeads, getAgentWiseLead, deleteLead
    ├── email.js         Full CRUD for email templates + attachments (8 hooks)
    └── campaignLeads.js getCampaignLeads, createCampaignLead, toggleCampaignLeadActive (optimistic),
                         syncCampaignLeadRule, leadFilters (accepts {sd, ed} for date-scoped filter options)
```

**Consumers always import from `@/services`** — never reach into `services/api.js` or `services/endpoints/*` directly. Endpoint files import `dashboardApi` from `'../api'`.

---

## src/shared/ — Cross-feature reusables

```
src/shared/
├── components/
│   ├── ConfirmDeletePopup.jsx    Generic delete confirmation modal (used by leads + email-templates)
│   ├── TotalDialsToday.jsx       KPI strip — used by Dashboard, CallPage, SelectivePage
│   └── layout/
│       ├── TopNav.jsx            Sticky navbar — date picker, dial-next, auth info, nav links
│       └── PageContainer.jsx     Max-width wrapper (currently unused, available)
├── context/
│   └── VicidialPopupContext.jsx  openPopup/closePopup for the VICIdial popup window
├── hooks/
│   └── useToast.jsx              success/error/info wrappers around react-hot-toast
└── lib/
    └── utils.js                  cn() — clsx + tailwind-merge
```

---

## Redux state shape

```js
{
  dashboardApi: <RTK Query slice>,
  session:                    // features/auth/slices/sessionSlice
  auth:                       // features/auth/slices/authSlice
  dial:                       // features/calls/slices/dialSlice
  call:                       // features/calls/slices/callSlice
  dateFilter:                 // features/dashboard/slices/dateFilterSlice
  campaignAndUsernameFilter:  // features/dashboard/slices/campaignAndUsernameFilterSlice
}
```

Store is configured in `src/app/store.js` — pulls slice reducers via `@/` aliased imports from each feature.

---

## Key conventions

- **`@/` alias for cross-feature imports.** Intra-feature imports stay relative (`./components/...`, `./slices/...`).
- **`injectEndpoints` pattern** — `services/api.js` is the empty shell; each `endpoints/*.js` file calls `dashboardApi.injectEndpoints(...)` and re-exports its hooks. The `services/index.js` barrel ensures `api.js` loads before any endpoint file.
- **`baseQuery.js` reaches into `features/auth/slices/sessionSlice`** to dispatch `showSessionPopup` on 401 — service → feature is intentional (one-off coupling).
- **`features/email-templates/utils.jsx`** must keep its `.jsx` extension — `getFileIcon()` returns JSX. Sister `campaign-leads/utils.js` is plain `.js` (no JSX).
- **Optimistic update** — `toggleCampaignLeadActive` in `endpoints/campaignLeads.js` flips `isactive` in cache before the server confirms; rolls back on failure.
- **`TotalDialsToday` lives in `shared/components/`** because three pages render it (Dashboard, CallPage, Selective). It imports `OverviewCard` from `@/features/dashboard/components/OverviewCard`.
