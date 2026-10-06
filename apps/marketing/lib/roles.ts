import { APP_SCOPE } from "@/constants";
import type { IUserScope } from "@/types/user";

export type MarketingRole = "super_admin" | "marketing_manager" | "marketing_specialist" | "content_writer" | "client_reviewer";

/**
 * The roles a person holds in Marketing (FS-MKT-4): the digital_marketing scope's roles, plus super
 * admin when they are the organisation's super admin. Same rule as the API (local-dev mock).
 */
export function marketingRoles(scopes: IUserScope[] | undefined | null): MarketingRole[] {
  const list = scopes ?? [];
  const own = new Set<MarketingRole>((list.find((s) => s.scope === APP_SCOPE)?.roles ?? []) as MarketingRole[]);
  if (list.find((s) => s.scope === "global")?.roles?.includes("super_admin")) own.add("super_admin");
  return [...own];
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

export function permissionsFor(scopes: IUserScope[] | undefined | null): MarketingPermissions {
  const roles = marketingRoles(scopes);
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
