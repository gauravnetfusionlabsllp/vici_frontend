import { useGetWaSessionsQuery } from '@/services';

const CONNECTED = ['WORKING', 'CONNECTED', 'AUTHENTICATED', 'READY'];

// True only when at least one WhatsApp session is live. Used to hide chat
// history when the number is logged out (or the WA server is unreachable).
export function useWaConnected() {
  const { data: sessions = [], isLoading, isError } = useGetWaSessionsQuery(undefined, {
    pollingInterval: 8000,
  });
  const connected = sessions.some((s) =>
    CONNECTED.includes(String(s?.status || s?.state || '').toUpperCase()),
  );
  return { connected, isLoading, isError, sessions };
}
