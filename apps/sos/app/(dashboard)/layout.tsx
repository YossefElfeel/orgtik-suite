"use client";

import { SuiteFrame } from "@/components/suite/SuiteFrame";
import { LoadingState } from "@orgtik/ui";
import { useClientSession } from "@orgtik/ui/auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMounted } from "@/hooks/use-mounted";

// The signed-in area, in the suite's frame (FS-SOS-1). The rail, the header pill bar, the logout
// tile and the impersonation strip it replaced are gone; see components/suite.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = useClientSession(), mounted = useMounted(), router = useRouter();
  useEffect(() => {
    if (mounted && !session?.tokens.accessToken) {
      const path = window.location.pathname.replace(/^\/sos(?=\/|$)/, "") || "/";
      router.replace(`/auth/login?redirect=${encodeURIComponent(path + window.location.search)}`);
    }
  }, [mounted, session?.tokens.accessToken, router]);
  if (!mounted || !session?.tokens.accessToken) return <LoadingState rows={4} />;
  // The shell scrolls its own content; anchor it to the viewport so navigation
  // from a scrolled auth page cannot leave a second document scrollbar.
  return (
    <div className="fixed inset-0">
      <SuiteFrame>{children}</SuiteFrame>
    </div>
  );
}
