import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Billing");
  return { title: t("invoices.title") };
}

export default function InvoicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
