import { SuiteFrame } from "@/components/suite/SuiteFrame";

// The signed-in area, in the suite's frame (FS-SOS-1). The rail, the header pill bar, the logout
// tile and the impersonation strip it replaced are gone; see components/suite.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <SuiteFrame>{children}</SuiteFrame>;
}
