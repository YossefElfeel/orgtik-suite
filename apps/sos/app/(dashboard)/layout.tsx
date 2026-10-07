import { SuiteFrame } from "@/components/suite/SuiteFrame";

// The signed-in area, in the suite's frame (FS-SOS-1). The rail, the header pill bar, the logout
// tile and the impersonation strip it replaced are gone; see components/suite.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // The shell scrolls its own content; anchor it to the viewport so navigation
  // from a scrolled auth page cannot leave a second document scrollbar.
  return (
    <div className="fixed inset-0">
      <SuiteFrame>{children}</SuiteFrame>
    </div>
  );
}
