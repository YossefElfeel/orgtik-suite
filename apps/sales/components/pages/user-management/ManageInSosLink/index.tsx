"use client";

// Roles and access to the CRM are granted in SOS (the `sales` scope), so that is where an admin
// changes them (SAL-006). Admins only.
import { useTranslations } from "next-intl";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { buttonVariants } from "@orgtik/ui";
import { SOS_URL } from "@somion/sos-bar";
import { useRole } from "@/hooks/useRole";

export const SOS_ACCESS_URL = `${SOS_URL}/go/global?redirect=${encodeURIComponent("/systems")}`;

export default function ManageInSosLink({ variant = "secondary" }: { variant?: "primary" | "secondary" }) {
  const t = useTranslations("Team.users");
  const { isAdmin, readOnlySession } = useRole();
  if (!isAdmin || readOnlySession) return null;
  return (
    <a href={SOS_ACCESS_URL} className={buttonVariants({ variant })}>
      {t("manageInSos")}
      <ArrowSquareOut aria-hidden className="size-4 rtl:-scale-x-100" />
    </a>
  );
}
