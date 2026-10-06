import { Suspense } from "react";
import { LoadingState } from "@orgtik/ui";
import { OurAudience } from "@/components/pages/posts/our-audience/OurAudience";

// Tab, search and page live in the URL (useSearchParams), hence the boundary.
export default function OurAudiencePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <OurAudience />
    </Suspense>
  );
}
