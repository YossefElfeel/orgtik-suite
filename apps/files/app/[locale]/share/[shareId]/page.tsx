import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PublicShareViewer } from "@/components/public-share/PublicShareViewer";

// A shared link is private: never indexed. Its title is in the reader's language.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PublicShare" });
  return { title: t("pageTitle"), robots: { index: false, follow: false } };
}

export default async function PublicSharePage({
  params,
  searchParams,
}: {
  params: Promise<{ shareId: string }>;
  searchParams: Promise<{ secret?: string }>;
}) {
  const { shareId } = await params;
  const { secret } = await searchParams;

  return <PublicShareViewer shareId={shareId} secret={secret} />;
}
