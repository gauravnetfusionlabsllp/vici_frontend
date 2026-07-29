import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sidebar-collapsed";

function readInitial() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/** Desktop sidebar collapse state, persisted so it survives reloads. */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(readInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // Private mode / quota — the layout still works, it just won't persist.
    }
  }, [collapsed]);

  const toggle = useCallback(() => setCollapsed((v) => !v), []);

  return [collapsed, toggle];
}
