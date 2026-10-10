import { handoffCode, readClientSession } from "@orgtik/ui/auth";
import { SOS_URL } from "@somion/sos-bar";
import { AUTH_API_URL } from "@/constants";
/** Establish the suite session before following a current tool or staff Console destination. */
export async function openSuiteDestination(href: string) {
  const session = readClientSession();
  if (!session) { window.location.assign(href); return; }
  const url = new URL(href, SOS_URL);
  const destination = url.pathname + url.search;
  await fetch(`${SOS_URL}/auth/handoff`, { mode: "no-cors" });
  const code = await handoffCode(AUTH_API_URL, session.tokens.accessToken, "suite");
  window.location.assign(`${SOS_URL}/auth/handoff?code=${encodeURIComponent(code)}&redirect=${encodeURIComponent(destination)}`);
}
