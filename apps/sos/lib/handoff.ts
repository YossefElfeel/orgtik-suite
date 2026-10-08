// Every launch obtains a single-use, destination-scoped code; URLs carry no bearer token.
// Staff launches first prepare an explicit staff family without replacing the customer tab.
import { API_URL } from "@/constants/env";
import { handoffCode, staffTargetToken, type Audience } from "@orgtik/ui/auth";

/** Suite apps whose /auth page exchanges ?code= (migrated in their waves). */
export const CODE_APPS = new Set(["digital_marketing", "file_manager", "hq", "hr_system", "platform_admin", "sales", "task_manager", "website_manager"]);
const AUDIENCES: Record<string, Audience> = { global: "suite", task_manager: "tool:tasks", file_manager: "tool:files", hr_system: "tool:hr", sales: "tool:sales", digital_marketing: "tool:marketing", hq: "tool:chats", platform_admin: "staff:admin", website_manager: "staff:wm", website_manager_legacy: "staff:wm" };

export async function handoffHref(domain: string, accessToken: string, opts: { scope?: string; locale?: string } = {}): Promise<string> {
  const base = domain.replace(/\/$/, "");
  const path = `${base}${opts.locale ? `/${opts.locale}` : ""}/auth`;
  const audience = AUDIENCES[opts.scope || "global"];
  if (!audience) throw new Error("This app has no session destination.");
  // Let a cold target render its entry route before the short-lived code is issued.
  // The shared presentation launcher uses the same browser-only warm-up pattern.
  await fetch(path, { mode: "no-cors" });
  const destinationToken = audience.startsWith("staff:") ? await staffTargetToken(API_URL, accessToken, audience === "staff:admin" ? "admin" : "wm") : accessToken;
  const code = await handoffCode(API_URL, destinationToken, audience);
  return `${path}?code=${encodeURIComponent(code)}`;
}
