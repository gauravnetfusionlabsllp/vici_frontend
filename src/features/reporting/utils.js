export function shortDate(str) {
  if (!str) return '—';
  return str.slice(0, 16).replace('T', ' ');
}
