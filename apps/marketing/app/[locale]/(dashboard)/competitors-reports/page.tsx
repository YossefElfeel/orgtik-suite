import { Suspense } from "react";
import { LoadingState } from "@orgtik/ui";
import { CompetitorsReport } from "@/components/pages/competitorsReports/CompetitorsReport";

// Search, platform and sort live in the URL (useSearchParams), hence the boundary.
export default function CompetitorsReportsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CompetitorsReport />
    </Suspense>
  );
}
