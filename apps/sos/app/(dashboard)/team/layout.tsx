import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { RequireWorkspaceRole } from "@/components/workspace/RequireWorkspaceRole";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Team");
  return { title: t("title") };
}

// The team (USR-13/14): everyone in the workspace reads it; the owner and admins change it.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RequireWorkspaceRole role="member">
      <Suspense>{children}</Suspense>
    </RequireWorkspaceRole>
  );
}
