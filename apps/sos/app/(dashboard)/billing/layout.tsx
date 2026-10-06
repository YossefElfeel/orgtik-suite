import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RequireWorkspaceRole } from "@/components/workspace/RequireWorkspaceRole";

// Billing is the workspace owner's (spec 05 §1, USR-09…12): every page under it is gated here,
// and the API checks again.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Billing");
  return { title: t("subscriptions.title") };
}

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return <RequireWorkspaceRole role="owner">{children}</RequireWorkspaceRole>;
}
