/**
 * Quiet mode, for tests and walk-throughs (Chats wave, FS-CHT-1). Open any page with `?__quiet=1`
 * and, for the rest of that tab's session, the simulator sends no random moves or messages and the
 * inactivity monitor never signs anyone out. `?__quiet=0` turns it off. Scripted hotkeys still work.
 */

const KEY = "hq.quiet";

export function isQuiet(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const asked = new URLSearchParams(window.location.search).get("__quiet");
    if (asked === "1") sessionStorage.setItem(KEY, "1");
    if (asked === "0") sessionStorage.removeItem(KEY);
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
