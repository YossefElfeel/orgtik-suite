import { appRelativePath, pathInApp } from "@orgtik/ui/auth";

/**
 * Where to go after signing in or after a hand-off: only a path on this site. An absolute or
 * protocol-relative value could send a freshly signed-in person anywhere (an open redirect,
 * SOS-002). Browsers drop tabs and line breaks inside URLs, so "/\t/evil.com" would become
 * "//evil.com": they're removed before checking.
 */
export function safeRedirect(value: string | null | undefined, fallback = "/"): string {
  const v = appRelativePath((value ?? "").replace(/[\t\n\r]/g, ""));
  if (!v.startsWith("/") || v.startsWith("//") || v.startsWith("/\\")) return fallback;
  if (v.startsWith("/auth")) return fallback;
  return v;
}

/**
 * A return address in another suite app (TASKS-021): after a 401 an app sends people here with its
 * own full address. It's followed only when its origin is one of the person's own apps (their
 * scopes' domains), and then through a one-time-code hand-off, never as a bare redirect. Returns
 * the app's scope and the path to land on there, or null.
 */
export function suiteReturn(
  value: string | null | undefined,
  scopes: { name: string; domain?: string | null }[] | undefined,
): { scope: string; domain: string; path: string } | null {
  const v = (value ?? "").replace(/[\t\n\r]/g, "");
  if (!/^https?:\/\//i.test(v) || !scopes?.length) return null;
  let url: URL;
  try {
    url = new URL(v);
  } catch {
    return null;
  }
  // Several services now share one origin. Match the longest registered app
  // prefix, rather than allowing the first matching hostname to claim them all.
  const app = [...scopes].sort((a, b) => String(b.domain || "").length - String(a.domain || "").length)
    .find((s) => Boolean(s.domain) && pathInApp(url, String(s.domain)) !== null);
  if (!app?.domain) return null;
  // The app's own locale prefix and auth pages aren't a destination.
  const path = pathInApp(url, String(app.domain))!.replace(/^\/(en|ar|de|fr|it)(?=\/|$)/, "") || "/";
  if (path.startsWith("/auth")) return { scope: app.name, domain: String(app.domain), path: "/" };
  return { scope: app.name, domain: String(app.domain), path: `${path}${url.search}` };
}
