import { Suspense } from "react";
import { LoadingState } from "@orgtik/ui";
import { OurReports } from "@/components/pages/ourReports/OurReports";

// The period, tab, filters and sort live in the URL (useSearchParams), hence the boundary.
export default function OurReportsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <OurReports />
    </Suspense>
  );
}
