import { PlanManagementChrome } from "@/components/pages/plan-management/shared/PlanManagementChrome";

export default function PlanManagementLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PlanManagementChrome>{children}</PlanManagementChrome>;
}
