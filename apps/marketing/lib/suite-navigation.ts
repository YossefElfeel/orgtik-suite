import { handoffCode, readClientSession } from "@orgtik/ui/auth";
import { SOS_URL } from "@/constants";
import { SOS_API_URL } from "@/constants/env";
export async function openMarketingSuiteDestination(href: string) {
  const session = readClientSession();
  if (!session) {
    window.location.assign(href);
    return;
  }
  const destination = new URL(href, SOS_URL);
  await fetch(`${SOS_URL}/auth/handoff`, { mode: "no-cors" });
  const code = await handoffCode(
    SOS_API_URL,
    session.tokens.accessToken,
    "suite",
  );
  window.location.assign(
    `${SOS_URL}/auth/handoff?code=${encodeURIComponent(code)}&redirect=${encodeURIComponent(destination.pathname + destination.search)}`,
  );
}
