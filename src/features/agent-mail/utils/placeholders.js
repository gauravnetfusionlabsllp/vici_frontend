const TOKEN_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function extractPlaceholders(...texts) {
  const seen = new Set();
  for (const t of texts) {
    if (!t) continue;
    let m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(t)) !== null) seen.add(m[1]);
  }
  return [...seen];
}

export function fillText(text, values = {}) {
  if (!text) return '';
  return text.replace(TOKEN_RE, (_, key) => {
    const v = values[key];
    return v == null || v === '' ? `{{${key}}}` : String(v);
  });
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (s) => EMAIL_RE.test((s ?? '').trim());
