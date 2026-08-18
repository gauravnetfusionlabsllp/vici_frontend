// Shared definitions for the META lead cohort the dashboard reports on.
//
// META_COHORT_START is the cohort floor: every META lead delivered on/after 13 Jul 2026.
// It mirrors REDIAL_FROM_DATE in api/config.py — the same go-live date the redial queue
// uses — so both views talk about the same body of leads. No `ed` is ever sent with it:
// "till date" is open-ended, so the range never goes stale at midnight.
export const META_COHORT_START = '2026-07-13';

// What "called" means is NOT set here — CALLED_BASIS lives in src/services/endpoints/
// dashboard.js so every meta-stats caller (this section, the KPI strip, Lead Management)
// shares one definition instead of each passing its own.
