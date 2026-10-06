/** Readable message out of an RTK Query error.
 *
 * Same shape as features/whatsapp-automation/utils.js — the repo duplicates
 * this per feature rather than sharing it — plus one extra case: the bulk-link
 * route raises HTTPException(400, {"message": ..., "errors": [...]}), so
 * `detail` is an OBJECT. Without that branch every batch rejection rendered as
 * the generic fallback and the admin never saw which row was wrong.
 */
export function apiError(e, fallback = 'Something went wrong') {
  const d = e?.data?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg).filter(Boolean).join(' ') || fallback;
  if (d && typeof d === 'object') {
    const errs = Array.isArray(d.errors) ? d.errors.filter(Boolean) : [];
    if (errs.length) return `${d.message || 'Nothing was saved'}: ${errs.join('; ')}`;
    if (d.message) return d.message;
  }
  return e?.error || e?.message || fallback;
}

export const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
};
