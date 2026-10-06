import { redirect } from "@/i18n/routing";

export default async function ProjectIndex({ params }: { params: Promise<{ locale: string; projectId: string }> }) {
  const { locale, projectId } = await params;
  redirect({ href: `/projects/${projectId}/board`, locale });
}
