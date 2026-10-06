"use client";

// A page for some people only (FS-SOS-10, SOS-026). Before, only the navigation hid these pages:
// a direct link showed "New system", "Delete" and the Active switch to anyone. Now the page itself
// says it isn't for you, with the way home. The API still has the last word.
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { NoPermissionState, Spinner } from "@orgtik/ui";
import useUser from "@/hooks/use-user";
import { useMounted } from "@/hooks/use-mounted";
import { ButtonLink } from "@/components/shared/ButtonLink";

export function RequireRole({ role, children }: { role: "admin" | "websiteManager"; children: ReactNode }) {
  const t = useTranslations("Errors");
  const mounted = useMounted();
  const { user, isAdmin, isWebsiteManager } = useUser();
  if (!mounted || !user) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner />
      </div>
    );
  }
  const allowed = role === "admin" ? isAdmin : isWebsiteManager || isAdmin;
  if (!allowed) {
    return <NoPermissionState titleAs="h1" title={t("noAccessTitle")} description={t("noAccessBody")} action={<ButtonLink href="/">{t("toHome")}</ButtonLink>} />;
  }
  return <>{children}</>;
}
