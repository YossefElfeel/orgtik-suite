import { useAppSelector } from "@/redux/app/hooks";
import type { SessionUser } from "@/types/user";
import { permissionsFor, type MarketingPermissions } from "./roles";

export { marketingRoles, permissionsFor, type MarketingRole, type MarketingPermissions } from "./roles";

/**
 * True for a "View as" session (D-017): the token says readOnly, and the API refuses every change.
 * The screens hide their changes too, so the person isn't offered buttons that can only fail.
 */
function readOnlyClaim(token: string | null | undefined): boolean {
  if (!token) return false;
  try {
    const part = token.split(".")[1];
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return json?.readOnly === true;
  } catch {
    return false;
  }
}

type Permissions = MarketingPermissions & { readOnlySession: boolean };

/** The person's rights now: their roles, with every change turned off in a View as session. */
export function useMarketingRoles(): Permissions {
  const scopes = useAppSelector((s) => (s.auth.user as SessionUser | null)?.scopes);
  const token = useAppSelector((s) => s.auth.token);
  const p = permissionsFor(scopes);
  if (!readOnlyClaim(token)) return { ...p, readOnlySession: false };
  return {
    ...p,
    readOnlySession: true,
    manageProjects: false,
    deleteProjects: false,
    manageIntegrations: false,
    syncIntegrations: false,
    editCampaigns: false,
    editPosts: false,
    boost: false,
    uploadMedia: false,
    deleteAnyMedia: false,
    manageAudience: false,
  };
}
