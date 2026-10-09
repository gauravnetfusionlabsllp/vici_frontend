// Shared definitions for the META lead cohort the dashboard reports on.
//
// META_COHORT_START is the cohort floor: every META lead delivered on/after 1 Sep 2026
// (13 Jul 2026 until 2026-10-06, then 20 Sep, then 1 Sep from 2026-10-07). It used to
// mirror REDIAL_FROM_DATE in api/config.py; it no longer has to - set the two
// independently. No `ed` is ever sent with it: "till date" is open-ended, so the range
// never goes stale at midnight.
export const META_COHORT_START = '2026-09-01';
//2026-10-20

// What "called" means is NOT set here — CALLED_BASIS lives in src/services/endpoints/
// dashboard.js so every meta-stats caller (this section, the KPI strip, Lead Management)
// shares one definition instead of each passing its own.
