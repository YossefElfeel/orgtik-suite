"use client";

/**
 * SOMION HQ - APP SHELL
 *
 * The suite chrome every module renders inside. In production this is the
 * SaaS layer's /app shell and this file is deleted; the module keeps its
 * sidebar and content and slots into the real one.
 */

import { useEffect, type ReactNode } from "react";
import { ChatsRail } from "./ChatsRail";
import { HqSidebar } from "./HqSidebar";
import { SuiteShell } from "@orgtik/ui";
import { TopBarEnd, TopBarStart } from "./TopBar";
import { LiveRegion, PrototypeBadge, ToastHost } from "./ShellExtras";
import { MobileTabs } from "./MobileTabs";
import { RegisterServiceWorker } from "./RegisterServiceWorker";
import { ClientOnly } from "./ClientOnly";
import { resumeAudio } from "@/lib/audio";
import { InactivityMonitor } from "./InactivityMonitor";
import { NavProgress } from "./NavProgress";
import { SignedOutScreen } from "./SignedOutScreen";
import { SuiteGate, ViewAsBanner } from "./SuiteGate";
import { useWorkspace } from "@/store";
import { usePathname, useRouter } from "next/navigation";

export function AppShell({
  sidebar,
  children,
}: {
  sidebar?: ReactNode;
  children: ReactNode;
}) {
  // Workspace data comes from scoped polling; no ambient seed events or cross-tab relay.
  const signedOut = useWorkspace((s) => s.session.state === "signed_out");

  /* A module that is not switched on shows its entry point and nothing
     else, the way the suite would. */
  const activation = useWorkspace((s) => s.settings.activation.state);
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (activation === "off" && pathname.startsWith("/hq/") && !pathname.startsWith("/hq/activate")) router.replace("/hq/activate");
  }, [activation, pathname, router]);

  /* Browsers refuse to start an AudioContext before a gesture. Arming it on
     the first interaction means the first knock actually makes a sound. */
  useEffect(() => {
    const arm = () => resumeAudio();
    document.addEventListener("pointerdown", arm, { once: true });
    document.addEventListener("keydown", arm, { once: true });
    return () => {
      document.removeEventListener("pointerdown", arm);
      document.removeEventListener("keydown", arm);
    };
  }, []);

  /* No session, no chrome: the sign-in stands alone, as it does in the
     product, and the inactivity monitor is not mounted to argue with it. */
  if (signedOut) {
    return (
      <ClientOnly>
        <>
          <SignedOutScreen />
        </>
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
    <SuiteGate>
      {/* The suite's frame (FS-CHT-5): the rail and this sidebar at the reading start, in a sheet
          under 1024px opened from the top bar, so every section is reachable at every width. */}
      <SuiteShell
        rail={<ChatsRail />}
        sidebar={
          <div className="flex h-full flex-col overflow-y-auto border-e border-line bg-raised">
            {sidebar ?? <HqSidebar />}
          </div>
        }
        topBar={{ start: <TopBarStart />, end: <TopBarEnd /> }}
        banner={<ViewAsBanner />}
      >
        <NavProgress />
        <InactivityMonitor />
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
          {/* On a phone the module also navigates with bottom tabs. */}
          <MobileTabs />
        </div>
      </SuiteShell>
      <ToastHost />
      <LiveRegion />
      <RegisterServiceWorker />
    </SuiteGate>
    </ClientOnly>
  );
}
