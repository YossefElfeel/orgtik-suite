import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { RequireWorkspaceRole } from "@/components/workspace/RequireWorkspaceRole";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Services");
  return { title: t("title") };
}

// Services (USR-16..20): the catalogue and the workspace's requests. Requesting is for admins and the owner (services/new).
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RequireWorkspaceRole role="member">
      <Suspense>{children}</Suspense>
    </RequireWorkspaceRole>
  );
}
