import { redirect } from "@/i18n/routing";

// The app opens on the dashboard. This used to be an onboarding page with a project picker, where
// every sign-in landed (MKT-030); the picker is in the top bar now.
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/dashboard", locale });
}
