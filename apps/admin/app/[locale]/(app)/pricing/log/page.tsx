"use client";

import { RequirePermission } from "@/components/frame/RequirePermission";
import { PricingLog } from "@/components/pricing/PricingLog";

// ADM-14, the pricing log (spec 03).
export default function Page() {
  return (
    <RequirePermission permission="pricing:view">
      <PricingLog />
    </RequirePermission>
  );
}
