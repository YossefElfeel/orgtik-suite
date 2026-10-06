"use client";

// A customer-dashboard page for some workspace roles only (USR, spec 05 §1): billing is the
// owner's, the team the owner's and admins'. The page says why it isn't for you and how to get
// help; the API checks again (403 names the role it needs).
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ErrorState, LoadingState, NoPermissionState } from "@orgtik/ui";
import useWorkspace from "@/hooks/use-workspace";
import { useMounted } from "@/hooks/use-mounted";
import { ButtonLink } from "@/components/shared/ButtonLink";
import type { WorkspaceRole } from "@/redux/features/platform/platformApi";

const RANK: Record<WorkspaceRole, number> = { guest: 0, member: 1, admin: 2, owner: 3 };

export function RequireWorkspaceRole({ role, children }: { role: WorkspaceRole; children: ReactNode }) {
  const t = useTranslations("Workspace.gate");
  const tr = useTranslations("Workspace.roles");
  const mounted = useMounted();
  const ws = useWorkspace();
  if (!mounted || ws.isLoading) return <LoadingState rows={4} />;
  if (ws.error || !ws.me) return <ErrorState titleAs="h1" title={t("failedTitle")} description={t("failedBody")} onRetry={() => ws.refetch()} />;
  if (RANK[ws.me.workspace.role] < RANK[role]) {
    return <NoPermissionState titleAs="h1" title={t("title", { role: tr(role) })} description={t("body", { role: tr(role), name: ws.me.workspace.name })} action={<ButtonLink href="/">{t("toHome")}</ButtonLink>} />;
  }
  return <>{children}</>;
}
