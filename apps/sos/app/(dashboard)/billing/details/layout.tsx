import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Billing");
  return { title: t("details.title") };
}

export default function BillingDetailsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
