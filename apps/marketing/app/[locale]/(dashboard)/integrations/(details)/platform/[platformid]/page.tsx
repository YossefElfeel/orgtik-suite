import { Suspense } from "react";
import { IntegrationDetail } from "@/components/pages/integrations/details/IntegrationDetail";

// One connected account. `platformid` is the integration's id (the folder name is the old one).
export default async function IntegrationDetailPage({ params }: { params: Promise<{ platformid: string }> }) {
  const { platformid } = await params;
  return (
    <Suspense>
      <IntegrationDetail id={platformid} />
    </Suspense>
  );
}
