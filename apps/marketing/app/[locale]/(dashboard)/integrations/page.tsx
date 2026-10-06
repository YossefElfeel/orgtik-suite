import { Suspense } from "react";
import { IntegrationsHub } from "@/components/pages/integrations/hub/IntegrationsHub";

// The connected accounts hub (FS-MKT-11). Suspense: the tab is read from the address.
export default function IntegrationsPage() {
  return (
    <Suspense>
      <IntegrationsHub />
    </Suspense>
  );
}
