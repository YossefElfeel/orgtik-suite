"use client";

import { RequirePermission } from "@/components/frame/RequirePermission";
import { PricePreview } from "@/components/pricing/PricePreview";

// ADM-13, the price preview (spec 03).
export default function Page() {
  return (
    <RequirePermission permission="pricing:view">
      <PricePreview />
    </RequirePermission>
  );
}
