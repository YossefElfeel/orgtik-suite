import { redirect } from "@/i18n/routing";

// This address showed one hard-coded loan whatever its id (HR-032). Loans open from the Loans list
// and the payroll run's Loans tab as their own details; an old link lands on the list.
export default async function LegacyLoanPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/loans", locale });
}
