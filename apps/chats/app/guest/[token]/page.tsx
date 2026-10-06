import type { Metadata } from "next";
import { GuestJoin } from "@/features/meetings/GuestJoin";
import { getT } from "@/lib/server-i18n";

/** Guests are never indexed and never tracked. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("page.guestJoin", "Join meeting"), robots: { index: false, follow: false } };
}

export default async function GuestPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <GuestJoin token={token} />;
}
