import { useEffect, useState } from "react";

/**
 * False on the server and in the first client render, true after. The signed-in person lives in a
 * cookie only the browser reads, so anything that depends on who they are (the Admin badge, a
 * guard) waits for this: the server HTML and the first client render stay identical.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
