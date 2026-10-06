import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { RequireWorkspaceRole } from "@/components/workspace/RequireWorkspaceRole";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Support");
  return { title: t("title") };
}

// Support (USR-21..23): tickets with OrgTik. /support/new is linked from the suspended banner.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RequireWorkspaceRole role="member">
      <Suspense>{children}</Suspense>
    </RequireWorkspaceRole>
  );
}
