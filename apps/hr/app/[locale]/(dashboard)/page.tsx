import { redirect } from "@/i18n/routing";

// HR opens on Attendance, in the language the address carries (/ar → /ar/attendance), not the
// cookie's (HR-030).
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/attendance", locale });
}
