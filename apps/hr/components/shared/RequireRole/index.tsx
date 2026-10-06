"use client";

// A page someone may not open says so, in their language, with the way back (FS-HR-3, HR-011). It
// used to render nothing: a blank page. The roles come from the same table as the sidebar
// (constants/route-roles). Roles live in a cookie the server can't see the same way, so the decision
// waits for the browser; until then the page's own loading state shows.
import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { NoPermissionState } from "@orgtik/ui";
import { usePathname } from "@/i18n/routing";
import { rolesFor } from "@/constants/route-roles";
import { useUserRoles } from "@/hooks/useUserRoles";
import { ButtonLink } from "@/components/shared/ButtonLink";

export function RequireRole({ children }: { children: ReactNode }) {
  const t = useTranslations("errors");
  const pathname = usePathname();
  const { roles } = useUserRoles();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const needed = rolesFor(pathname);
  if (!ready || !needed || needed.some((role) => roles.includes(role))) return <>{children}</>;
  return (
    <div className="grid min-h-[60vh] place-items-center p-4">
      <NoPermissionState
        size="page"
        titleAs="h1"
        title={t("noAccessTitle")}
        description={t("noAccessBody")}
        action={<ButtonLink href="/">{t("toHome")}</ButtonLink>}
      />
    </div>
  );
}
