import { Suspense, type ReactNode } from "react";
import { LoadingState } from "@orgtik/ui";
import { ProfileReportFrame } from "@/components/pages/ourReports/profile/ProfileReportFrame";

// One profile's reports; :id is the profile (integration) id. The period lives in the URL.
export default function ProfileReportLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingState />}>
      <ProfileReportFrame>{children}</ProfileReportFrame>
    </Suspense>
  );
}
