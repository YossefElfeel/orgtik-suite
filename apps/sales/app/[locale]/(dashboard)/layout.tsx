import { SuiteFrame } from "@/components/suite/SuiteFrame";

// The suite shell from @orgtik/ui (rail, sidebar, top bar, banner slot) replaces SoSBar, the local
// sidebar, DashboardHeader and the silent RouteGuard (FS-SAL-2).
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SuiteFrame>{children}</SuiteFrame>;
}
