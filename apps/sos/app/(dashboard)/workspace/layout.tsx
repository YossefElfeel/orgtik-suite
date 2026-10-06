import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { RequireWorkspaceRole } from "@/components/workspace/RequireWorkspaceRole";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account");
  return { title: t("workspace.title") };
}

// Workspace settings (USR-26/27): the owner's.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RequireWorkspaceRole role="owner">
      <Suspense>{children}</Suspense>
    </RequireWorkspaceRole>
  );
}
