import { Suspense } from "react";
import { InvoicesView } from "@/components/workspace/billing/InvoicesView";

// USR-10: invoices. The page number lives in the address (useSearchParams needs the boundary).
export default function InvoicesPage() {
  return (
    <Suspense>
      <InvoicesView />
    </Suspense>
  );
}
