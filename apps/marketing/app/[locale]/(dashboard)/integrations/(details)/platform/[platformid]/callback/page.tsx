import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ConnectWizard } from "@/components/pages/integrations/connect/ConnectWizard";
import { isConnectable } from "@/components/pages/integrations/platforms";

// The provider's return address for a platform (`platformid` is the platform here, e.g. FACEBOOK).
// It exchanges the code, after checking the state, and replaces its own address with the wizard's
// step 2 (MKT-067: it rendered the word "page").
export default async function IntegrationCallbackPage({ params }: { params: Promise<{ platformid: string }> }) {
  const { platformid } = await params;
  if (!isConnectable(platformid)) notFound();
  return (
    <Suspense>
      <ConnectWizard platform={platformid.toUpperCase()} step={2} />
    </Suspense>
  );
}
