import { parsePhoneNumberFromString } from "libphonenumber-js/min";

// Mirrors api/services/phone.py normalize(), so the flag shown is the country
// the backend will actually dial: strip the 00 IDD prefix and trunk 0s, and
// treat a bare 10-digit number starting 6-9 as an Indian mobile.
function toE164(raw) {
  let digits = String(raw || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  digits = digits.replace(/^0+/, "");
  if (!digits) return null;
  if (digits.length === 10 && "6789".includes(digits[0])) digits = "91" + digits;
  return "+" + digits;
}

let regionNames;
try {
  regionNames = new Intl.DisplayNames(["en"], { type: "region" });
} catch {
  regionNames = null;
}

// { code: "IN", name: "India", callingCode: "91" } or null while the number is
// too short or ambiguous to pin to one country (e.g. a +1 area code not yet typed).
export function phoneCountry(raw) {
  const e164 = toE164(raw);
  if (!e164) return null;
  const parsed = parsePhoneNumberFromString(e164);
  const code = parsed?.country;
  if (!code) return null;
  return {
    code,
    name: regionNames?.of(code) || code,
    callingCode: parsed.countryCallingCode,
  };
}

// Emoji flags render as plain letters on Windows, so use an image instead.
export function flagUrl(code) {
  return `https://flagcdn.com/20x15/${code.toLowerCase()}.png`;
}
