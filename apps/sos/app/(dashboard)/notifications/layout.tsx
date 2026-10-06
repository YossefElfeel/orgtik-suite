import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { RequireWorkspaceRole } from "@/components/workspace/RequireWorkspaceRole";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account");
  return { title: t("notifications.title") };
}

// Notifications (USR-24): the person's own, in this workspace.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RequireWorkspaceRole role="guest">
      <Suspense>{children}</Suspense>
    </RequireWorkspaceRole>
  );
}
