"use client";

import { RequirePermission } from "@/components/frame/RequirePermission";
import { PriceGrid } from "@/components/pricing/PriceGrid";

// ADM-12, the price grid (spec 03).
export default function Page() {
  return (
    <RequirePermission permission="pricing:view">
      <PriceGrid />
    </RequirePermission>
  );
}
