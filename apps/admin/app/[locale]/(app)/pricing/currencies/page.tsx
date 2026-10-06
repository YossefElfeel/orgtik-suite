"use client";

import { RequirePermission } from "@/components/frame/RequirePermission";
import { CurrenciesPage } from "@/components/pricing/CurrenciesPage";

// ADM-08 and ADM-15, currencies and exchange rates (spec 03).
export default function Page() {
  return (
    <RequirePermission permission="pricing:view">
      <CurrenciesPage />
    </RequirePermission>
  );
}
