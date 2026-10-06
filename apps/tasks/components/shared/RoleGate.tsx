"use client";

// A page (or part of one) that only some roles may use. Everyone else sees why, inside the app, with
// the way back, instead of being sent out of Tasks (TASKS-020).
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { LockKey } from "@phosphor-icons/react";
import { NoPermissionState } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { useTaskRoles, type TaskPermissions } from "@/lib/permissions";

export function RoleGate({ allow, children }: { allow: (p: TaskPermissions) => boolean; children: ReactNode }) {
  const t = useTranslations("Errors");
  const permissions = useTaskRoles();
  if (allow(permissions)) return <>{children}</>;
  return (
    <NoPermissionState
      size="page"
      titleAs="h1"
      icon={<LockKey weight="duotone" />}
      title={t("noAccessTitle")}
      description={t("noAccessBody")}
      action={<ButtonLink href="/">{t("toDashboard")}</ButtonLink>}
    />
  );
}
