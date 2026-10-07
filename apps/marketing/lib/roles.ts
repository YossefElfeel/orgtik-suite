import { APP_SCOPE } from "@/constants";
import type { IUserScope } from "@/types/user";
import { toolAccess, type WorkspaceContext } from "@orgtik/ui/auth";

export type MarketingRole = "super_admin" | "marketing_manager" | "marketing_specialist" | "content_writer" | "client_reviewer";

/**
 * Current workspace Marketing roles, or the exact digital_marketing scope projection.
 * Identity/global admin grants never widen customer-workspace rights.
 */
export function marketingRoles(scopes: IUserScope[] | undefined | null, context?: WorkspaceContext | null): MarketingRole[] {
  const list = scopes ?? [];
  const own = new Set<MarketingRole>((list.find((s) => s.scope === APP_SCOPE)?.roles ?? []) as MarketingRole[]);
  const selected = context ? toolAccess(context, "marketing").roles : [...own];
  return selected.filter((role): role is MarketingRole => ["super_admin", "marketing_manager", "marketing_specialist", "content_writer", "client_reviewer"].includes(role));
}

/**
 * What a person may do, one flag per row of the role matrix in audits/marketing/wave-plan.md. The
 * mock answers 403 to the same rules; the screens hide what a role can't do (MKT-004).
 */
export type MarketingPermissions = {
  roles: MarketingRole[];
  /** Can open Marketing at all. */
  hasAccess: boolean;
  isAdmin: boolean;
  /** Creates and edits projects; super admins also delete them. */
  manageProjects: boolean;
  deleteProjects: boolean;
  /** Connects and disconnects social and ad accounts. */
  manageIntegrations: boolean;
  syncIntegrations: boolean;
  /** Creates, edits and publishes campaigns. */
  editCampaigns: boolean;
  /** Creates, edits and schedules posts. */
  editPosts: boolean;
  /** Spends money: boosts a post. */
  boost: boolean;
  /** Uploads to the gallery; deletes anything (otherwise only their own uploads). */
  uploadMedia: boolean;
  deleteAnyMedia: boolean;
  /** Labels, audience import and segments. */
  manageAudience: boolean;
  /** Only reads and reviews (the client reviewer). */
  isReviewerOnly: boolean;
};

export function permissionsFor(scopes: IUserScope[] | undefined | null, context?: WorkspaceContext | null): MarketingPermissions {
  const roles = marketingRoles(scopes, context);
  const has = (...r: MarketingRole[]) => r.some((x) => roles.includes(x));
  const isAdmin = has("super_admin");
  const lead = has("super_admin", "marketing_manager");
  const team = lead || has("marketing_specialist");
  return {
    roles,
    hasAccess: roles.length > 0,
    isAdmin,
    manageProjects: lead,
    deleteProjects: isAdmin,
    manageIntegrations: lead,
    syncIntegrations: team,
    editCampaigns: team,
    editPosts: team || has("content_writer"),
    boost: team,
    uploadMedia: team || has("content_writer"),
    deleteAnyMedia: lead,
    manageAudience: team,
    isReviewerOnly: roles.length > 0 && roles.every((r) => r === "client_reviewer"),
  };
}
