import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RequireWorkspaceRole } from "@/components/workspace/RequireWorkspaceRole";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Services.new");
  return { title: t("title") };
}

// Requesting a service (USR-17) is for the workspace's admins and owner.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <RequireWorkspaceRole role="admin">{children}</RequireWorkspaceRole>;
}
