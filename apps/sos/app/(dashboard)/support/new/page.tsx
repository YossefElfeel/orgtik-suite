import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NewTicketForm } from "@/components/workspace/support/SupportViews";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Support.new");
  return { title: t("title") };
}

// Linked from the "suspended" banner (components/suite/WorkspaceBanners.tsx): keep this path.
export default function NewTicketPage() {
  return <NewTicketForm />;
}
