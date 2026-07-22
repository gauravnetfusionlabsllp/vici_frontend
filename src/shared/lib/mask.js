// PII masking helpers. These transform only the *displayed* string — never the
// underlying data — so dialing, messaging, and email sending keep using real values.

// Show the first `visible` digits of a phone number, mask the rest with '*'.
// "9876543210" -> "98765*****", "+919876543210" -> "91987*******"
export function maskPhone(value, visible = 5) {
  if (value == null || value === '') return value;
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return String(value);
  if (digits.length <= visible) return digits;
  return digits.slice(0, visible) + '*'.repeat(digits.length - visible);
}

// Show the first 3 chars of the local part, then '****', keep the full domain.
// "abcdefg@gmail.com" -> "abc****@gmail.com"
export function maskEmail(value) {
  if (value == null || value === '') return value;
  const s = String(value).trim();
  const at = s.indexOf('@');
  if (at < 1) return s; // not email-shaped -> leave as-is
  return `${s.slice(0, 3)}****${s.slice(at)}`;
}

// Mask a comma/semicolon-separated list of addresses, preserving separators.
export function maskEmailList(value) {
  if (value == null || value === '') return value;
  return String(value)
    .split(/([,;]\s*)/)
    .map((p) => (p.includes('@') ? maskEmail(p) : p))
    .join('');
}
