import { redirect } from "@/i18n/routing";

// /teams/:id had no page, and the breadcrumb linked to it (TASKS-023): it opens the overview.
export default async function TeamIndex({ params }: { params: Promise<{ locale: string; teamId: string }> }) {
  const { locale, teamId } = await params;
  redirect({ href: `/teams/${teamId}/overview`, locale });
}
