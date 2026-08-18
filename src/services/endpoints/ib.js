// Shared query-string helper for the IB / non-IB split.
//
// The backend (api/core/utils.normalize_ib_filter) takes `ib=all|ib|non_ib`; 'all'
// is its default, so it is left off the URL entirely — that keeps the cache key for
// an unfiltered request identical to the plain endpoint every other caller uses.
export const IB_FILTERS = ['all', 'ib', 'non_ib'];

export const IB_LABELS = {
  all: 'All',
  ib: 'IB',
  non_ib: 'Non-IB',
};

export const ibParam = (ib) => (ib && ib !== 'all' ? `?ib=${encodeURIComponent(ib)}` : '');
