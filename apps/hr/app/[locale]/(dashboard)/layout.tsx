import { NotificationsSocketHost } from "@/components/layout/NotificationsSocketHost";
import { SuiteFrame } from "@/components/layout/SuiteFrame";
import { RequireRole } from "@/components/shared/RequireRole";

// HR's signed-in pages, inside the suite's frame (FS-HR-4), each guarded by the role table (FS-HR-3).
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SuiteFrame>
      <NotificationsSocketHost />
      <div className="min-h-full">
        <RequireRole>{children}</RequireRole>
      </div>
    </SuiteFrame>
  );
}
