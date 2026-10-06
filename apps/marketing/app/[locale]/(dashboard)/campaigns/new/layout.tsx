import { Suspense, type ReactNode } from "react";
import CampaignWizard from "@/components/pages/campaigns/create/CampaignWizard";

// The wizard lives in this layout, above the type and step segments, so it stays mounted while
// the steps change and clears its state when it closes (MKT-009).
export default function CampaignNewLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <CampaignWizard>{children}</CampaignWizard>
    </Suspense>
  );
}
