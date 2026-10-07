import { BackgroundUploadProvider } from "@/providers/background-upload-provider";
import { BackgroundUploadPanel } from "@/components/layout/BackgroundUploadPanel";
import { GlobalDropZone } from "@/components/layout/GlobalDropZone";
import { SuiteFrame } from "@/components/suite/SuiteFrame";
import { WorkspaceSessionGate } from '@/components/suite/WorkspaceSessionGate';

// VS-1: the suite shell from @orgtik/ui (rail, sidebar, top bar, banner slot) replaces SoSBar,
// the local Sidebar and DashboardHeader. Upload stays the app's own.
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WorkspaceSessionGate><BackgroundUploadProvider>
      <GlobalDropZone />
      <SuiteFrame>{children}</SuiteFrame>
      <BackgroundUploadPanel />
    </BackgroundUploadProvider></WorkspaceSessionGate>
  );
}
