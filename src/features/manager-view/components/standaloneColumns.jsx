import BoolBadge from '@/features/reporting/components/BoolBadge';
import RecordingPlayer from '@/features/reporting/components/RecordingPlayer';
import { maskEmail, maskPhone } from '@/shared/lib/mask';
import { fmtDateTime, fmtDuration, toContactArray } from '../utils';

const textFmt = (p) => (p.value === null || p.value === undefined || p.value === '' ? '—' : p.value);
const dateFmt = (p) => fmtDateTime(p.value);
const jsonText = (v) => (v && typeof v === 'object' ? JSON.stringify(v) : v ?? '');
// Mask phone/email for everyone but the PII viewer. maskPii comes from grid context.
const phoneFmt = (p) => (p.value === null || p.value === undefined || p.value === '' ? '—' : (p.context?.maskPii ? maskPhone(p.value) : p.value));
const emailFmt = (p) => (p.value === null || p.value === undefined || p.value === '' ? '—' : (p.context?.maskPii ? maskEmail(p.value) : p.value));

// § 2.2 — call-analysis
export const callAnalysisColumns = [
  { headerName: 'Call ID', field: 'call_id', width: 90, cellClass: 'font-mono text-muted-foreground' },
  { headerName: 'Agent', field: 'agent_user', width: 110, valueFormatter: textFmt },
  { headerName: 'Phone', field: 'phone', width: 140, cellClass: 'font-mono text-primary', valueFormatter: phoneFmt },
  { headerName: 'Start Time', field: 'start_time', width: 150, valueFormatter: dateFmt, cellClass: 'font-mono-nums text-muted-foreground' },
  { headerName: 'Duration', field: 'length_in_sec', width: 100, valueFormatter: (p) => fmtDuration(p.value), cellClass: 'font-mono-nums' },
  { headerName: 'Rating', field: 'overall_rating', width: 90, valueFormatter: textFmt, filter: 'agNumberColumnFilter' },
  { headerName: 'Stars', field: 'call_stars', width: 80, valueFormatter: textFmt, filter: 'agNumberColumnFilter' },
  { headerName: 'Outcome', field: 'call_outcome', width: 150, valueFormatter: textFmt },
  { headerName: 'Agent Sentiment', field: 'agent_sentiment', width: 130, valueFormatter: textFmt, cellClass: 'capitalize' },
  { headerName: 'Client Sentiment', field: 'client_sentiment', width: 130, valueFormatter: textFmt, cellClass: 'capitalize' },
  { headerName: 'Summary', field: 'summary', width: 260, tooltipField: 'summary', valueFormatter: textFmt, cellClass: 'text-foreground/85' },
  { headerName: 'Campaign ID', field: 'campaign_id', width: 120, valueFormatter: textFmt, cellClass: 'font-mono text-muted-foreground' },
  { headerName: 'Status', field: 'status', width: 110, valueFormatter: textFmt },
  {
    headerName: 'Recording', colId: '__recording', field: 'recording_link', width: 240, sortable: false, filter: false,
    cellRenderer: (p) => (p.value
      ? <RecordingPlayer src={p.value} title={p.data?.recording_filename || 'Call recording'} lengthSec={p.data?.length_in_sec} />
      : <span className="text-xs text-muted-foreground">—</span>),
  },
];

// § 2.3 — meta-leads
export const metaLeadsColumns = [
  { headerName: 'Lead ID', field: 'lead_id', width: 90, cellClass: 'font-mono text-muted-foreground' },
  { headerName: 'Leadgen ID', field: 'leadgen_id', width: 140, cellClass: 'font-mono text-muted-foreground', valueFormatter: textFmt },
  { headerName: 'Source', field: 'source', width: 120, valueFormatter: textFmt },
  { headerName: 'Campaign', field: 'campaign_name', width: 180, tooltipField: 'campaign_name', valueFormatter: textFmt },
  { headerName: 'Ad Set', field: 'ad_set_name', width: 160, tooltipField: 'ad_set_name', valueFormatter: textFmt },
  { headerName: 'Form', field: 'form_name', width: 160, tooltipField: 'form_name', valueFormatter: textFmt },
  { headerName: 'Ad', field: 'ad_name', width: 160, tooltipField: 'ad_name', valueFormatter: textFmt },
  { headerName: 'Created', field: 'created_at', width: 150, valueFormatter: dateFmt, cellClass: 'font-mono-nums text-muted-foreground' },
  { headerName: 'Name', field: 'name', width: 150, valueFormatter: textFmt, cellClass: 'font-medium text-foreground' },
  { headerName: 'Phone', field: 'phone', width: 140, cellClass: 'font-mono text-primary', valueFormatter: phoneFmt },
  { headerName: 'Email', field: 'email', width: 200, tooltipValueGetter: (p) => (p.context?.maskPii ? maskEmail(p.value) : p.value), valueFormatter: emailFmt },
  {
    headerName: 'Form Fields', field: 'raw_fields', width: 220, sortable: false,
    valueGetter: (p) => jsonText(p.data?.raw_fields),
    tooltipValueGetter: (p) => p.value,
    cellClass: 'font-mono text-[11px] text-muted-foreground',
    valueFormatter: textFmt,
  },
];

// § 2.4 — hot-meta-lead-notes
export const hotNotesColumns = [
  { headerName: 'Note ID', field: 'note_id', width: 90, cellClass: 'font-mono text-muted-foreground' },
  { headerName: 'Lead ID', field: 'meta_lead_id', width: 90, cellClass: 'font-mono text-muted-foreground' },
  { headerName: 'Agent', colId: 'agent', width: 150, valueGetter: (p) => p.data?.agent_name || p.data?.agent_user || '', valueFormatter: textFmt },
  { headerName: 'Name', field: 'name', width: 150, valueFormatter: textFmt, cellClass: 'font-medium text-foreground' },
  { headerName: 'Phone', field: 'phone', width: 140, cellClass: 'font-mono text-primary', valueFormatter: phoneFmt },
  { headerName: 'Contacted Via', field: 'how_contacted', width: 160, sortable: false, valueGetter: (p) => toContactArray(p.data?.how_contacted).join(', '), valueFormatter: textFmt },
  { headerName: 'Response', field: 'response', width: 200, tooltipField: 'response', valueFormatter: textFmt, cellClass: 'text-foreground/85' },
  { headerName: 'Registered', field: 'client_registered', width: 120, cellClass: 'flex items-center', cellRenderer: (p) => <BoolBadge value={p.value} /> },
  { headerName: 'Deposited', field: 'client_deposited', width: 115, cellClass: 'flex items-center', cellRenderer: (p) => <BoolBadge value={p.value} /> },
  { headerName: 'First Status', field: 'first_status_change', width: 150, valueFormatter: dateFmt, cellClass: 'font-mono-nums text-muted-foreground' },
  { headerName: 'Last Status', field: 'last_status_change', width: 150, valueFormatter: dateFmt, cellClass: 'font-mono-nums text-muted-foreground' },
  { headerName: 'Updated', field: 'updated_at', width: 150, valueFormatter: dateFmt, cellClass: 'font-mono-nums text-muted-foreground' },
  { headerName: 'Campaign', field: 'campaign_name', width: 170, tooltipField: 'campaign_name', valueFormatter: textFmt },
  { headerName: 'Ad Set', field: 'ad_set_name', width: 150, tooltipField: 'ad_set_name', valueFormatter: textFmt },
  { headerName: 'Form', field: 'form_name', width: 150, tooltipField: 'form_name', valueFormatter: textFmt },
  { headerName: 'Ad', field: 'ad_name', width: 150, tooltipField: 'ad_name', valueFormatter: textFmt },
  {
    headerName: 'Custom Fields', field: 'custom_fields', width: 200, sortable: false,
    valueGetter: (p) => jsonText(p.data?.custom_fields),
    tooltipValueGetter: (p) => p.value,
    cellClass: 'font-mono text-[11px] text-muted-foreground',
    valueFormatter: textFmt,
  },
];
