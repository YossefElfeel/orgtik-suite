import { SOS_URL } from "@somion/sos-bar";
import { appRelativePath } from "@orgtik/ui/auth";

/**
 * Where to send someone without a session (FS-HR-2): SOS opens HR again with a one-time code and
 * brings them back to `path` (SOS's /go/<app>?redirect=…, which only follows paths in the app).
 */
export function suiteSignIn(path: string): string {
  const clean = appRelativePath(path.replace(/[\t\n\r]/g, ""));
  const keep = clean.startsWith("/") && !clean.startsWith("//") && clean !== "/" ? `?redirect=${encodeURIComponent(clean)}` : "";
  return `${SOS_URL}/go/hr_system${keep}`;
}
