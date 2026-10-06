"use client";

import { RequirePermission } from "@/components/frame/RequirePermission";
import { ZonesPage } from "@/components/pricing/ZonesPage";

// ADM-09/10/11, zones and countries (spec 03).
export default function Page() {
  return (
    <RequirePermission permission="pricing:view">
      <ZonesPage />
    </RequirePermission>
  );
}
