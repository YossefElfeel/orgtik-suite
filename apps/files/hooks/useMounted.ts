import { useEffect, useState } from "react";

/**
 * False on the server and in the first client render, true after. The signed-in user lives in a
 * cookie only the browser reads, so anything that depends on who they are (a super-admin button)
 * waits for this: the server HTML and the first client render stay identical (no hydration error).
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
