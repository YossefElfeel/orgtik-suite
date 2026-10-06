"use client";

// "View as" a person: SOS's read-only, audited View as (D-017), never Sales' own impersonation.
// "Sign in as" swapped the admin's session for the person's full token (SAL-004); it is gone.
// Admins only, for people who have an account, and not from inside a View as session.
import { useTranslations } from "next-intl";
import { Eye } from "@phosphor-icons/react";
import { buttonVariants } from "@orgtik/ui";
import { SOS_URL } from "@somion/sos-bar";
import { useRole } from "@/hooks/useRole";
import { isolate } from "@/lib/bidi";

export default function ViewAsLink({ authUserId, name }: { authUserId: number | null | undefined; name: string }) {
  const t = useTranslations("Team.users");
  const { isAdmin, readOnlySession } = useRole();
  if (!isAdmin || readOnlySession || authUserId === null || authUserId === undefined) return null;
  return (
    <a
      href={`${SOS_URL}/people?viewAs=${encodeURIComponent(String(authUserId))}`}
      aria-label={t("viewAsAria", { name: isolate(name) })}
      className={buttonVariants({ variant: "secondary" })}
    >
      <Eye aria-hidden className="size-4" />
      {t("viewAs")}
    </a>
  );
}
