/**
 * The message to show when /call fails. A 503 is the server saying Stringee
 * itself is unreachable, and its detail is written for the agent ("Stringee
 * service is down - calls will start connecting once it comes back"). Every
 * other failure keeps the caller's own generic text, as before.
 */
export const dialErrorMessage = (e, fallback) =>
  (e?.status === 503 && e?.data?.detail) || fallback;
