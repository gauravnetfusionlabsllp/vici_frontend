// Helpers for dialling a number the agent chose (the manual-dial box on the
// call page, the Call button on Reporting). Shared so both start a call the
// exact same way - see hooks/useDialNumber.js.

export function normalizePhone(raw) {
  if (!raw) return "";
  // keep + and digits
  return String(raw).replace(/[^\d+]/g, "").trim();
}

export function isValidPhone(p) {
  // basic: must have at least 6 digits
  const digits = String(p || "").replace(/[^\d]/g, "");
  return digits.length >= 6;
}

const MANUAL_DEFAULT_LEAD = {
  phone_number: "",
  first_name: "Manual",
  last_name: "Call",
  city: "—",
  lead_id: "—",
  entry_date: "—",
  list_id: "—",
};

/** The lead the call page shows for a dialled number: whatever /call returned, never blanks. */
export function buildManualLead(details, phone) {
  const d = details && typeof details === "object" ? details : {};

  const out = {
    ...MANUAL_DEFAULT_LEAD,
    ...d, // take whatever backend gives
  };

  // always override with the number that was dialled
  out.phone_number = phone;

  // ensure key fields are not empty/undefined
  if (!out.first_name?.trim?.()) out.first_name = "Manual";
  if (!out.last_name?.trim?.()) out.last_name = "Call";

  // city can be empty => show —
  if (!out.city?.trim?.()) out.city = "—";

  // ids/dates/list should not be undefined/null
  if (out.lead_id === null || out.lead_id === undefined || out.lead_id === "") out.lead_id = "—";
  if (!out.entry_date) out.entry_date = "—";
  if (out.list_id === null || out.list_id === undefined || out.list_id === "") out.list_id = "—";

  return out;
}
