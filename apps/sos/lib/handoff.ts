// The hand-off from SOS to another suite app (FS-SOS-2, D-017 as proposed). Apps whose /auth page
// takes a one-time code get one: SOS asks the identity API for a code (single use, 60 s) and the
// address carries only that. The others still read the access token from the address until their
// wave moves them over; that path lives here alone and goes when the last one has.
import { API_URL } from "@/constants/env";

/** Suite apps whose /auth page exchanges ?code= (migrated in their waves). */
export const CODE_APPS = new Set(["digital_marketing", "file_manager", "hq", "hr_system", "platform_admin", "sales", "task_manager", "website_manager"]);

export async function handoffHref(domain: string, accessToken: string, opts: { scope?: string; locale?: string } = {}): Promise<string> {
  const base = domain.replace(/\/$/, "");
  const path = `${base}${opts.locale ? `/${opts.locale}` : ""}/auth`;
  if (opts.scope && CODE_APPS.has(opts.scope)) {
    const r = await fetch(`${API_URL}/auth/handoff`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
    if (!r.ok) throw new Error(`handoff ${r.status}`);
    const code = (await r.json())?.data?.code as string | undefined;
    if (!code) throw new Error("handoff: no code");
    return `${path}?code=${encodeURIComponent(code)}`;
  }
  return `${path}?token=${encodeURIComponent(accessToken)}`;
}
