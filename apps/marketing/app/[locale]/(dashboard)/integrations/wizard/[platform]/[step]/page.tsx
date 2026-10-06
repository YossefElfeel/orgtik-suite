import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ConnectWizard, type WizardStep } from "@/components/pages/integrations/connect/ConnectWizard";
import { isConnectable } from "@/components/pages/integrations/platforms";

// /integrations/wizard/:platform/:step. An unknown platform or a step other than 1–3 is a 404; it
// rendered an empty page (MKT-062).
export default async function ConnectWizardPage({ params }: { params: Promise<{ platform: string; step: string }> }) {
  const { platform, step } = await params;
  const n = Number(step);
  if (!isConnectable(platform) || ![1, 2, 3].includes(n) || String(n) !== step) notFound();
  return (
    <Suspense>
      <ConnectWizard platform={platform.toUpperCase()} step={n as WizardStep} />
    </Suspense>
  );
}
