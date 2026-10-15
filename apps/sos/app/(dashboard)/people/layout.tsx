import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RequireRole } from "@/components/shared/RequireRole";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Nav");
  return { title: t("people") };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RequireRole role="admin" permission="staff:view">{children}</RequireRole>;
}
