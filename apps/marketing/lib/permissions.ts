import { useAppSelector } from "@/redux/app/hooks";
import type { SessionUser } from "@/types/user";
import { permissionsFor, type MarketingPermissions } from "./roles";
import { useClientSession, toolAccess } from "@orgtik/ui/auth";

export { marketingRoles, permissionsFor, type MarketingRole, type MarketingPermissions } from "./roles";

/**
 * True for a "View as" session (D-017): the token says readOnly, and the API refuses every change.
 * The screens hide their changes too, so the person isn't offered buttons that can only fail.
 */

type Permissions = MarketingPermissions & { readOnlySession: boolean };

/** The person's rights now: their roles, with every change turned off in a View as session. */
export function useMarketingRoles(): Permissions {
  const scopes = useAppSelector((s) => (s.auth.user as SessionUser | null)?.scopes);
  const session = useClientSession();
  const access = toolAccess(session?.workspaceContext, "marketing", session?.scopes || scopes);
  const p = permissionsFor((session?.scopes || scopes) as SessionUser["scopes"], session?.workspaceContext);
  if (access.canWrite && !access.readOnly) return { ...p, readOnlySession: false };
  return {
    ...p,
    readOnlySession: access.readOnly,
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
