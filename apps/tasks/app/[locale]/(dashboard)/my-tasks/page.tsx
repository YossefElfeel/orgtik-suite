import { redirect } from "@/i18n/routing";

export default async function MyTasksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/my-tasks/overview", locale });
}
