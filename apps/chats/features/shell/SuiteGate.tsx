"use client";

/**
 * CHATS - IN THE SUITE (Chats wave, FS-CHT-4)
 *
 * With the suite configured, Chats opens only with a suite session: without one it goes back to SOS,
 * which opens Chats again with a fresh one-time code (signing in first if needed). There is no demo
 * sign-in and no demo person. With a session, the person takes their seat before anything renders,
 * so nobody else's name flashes in the top bar.
 */

import { useEffect, useState, type ReactNode } from "react";
import { EyeSlash } from "@phosphor-icons/react";
import { BannerRegion, Button, LoadingState } from "@orgtik/ui";
import { useT } from "@/lib/i18n";
import { useWorkspace } from "@/store";
import { inSuite, readSuiteSession, stopViewing, suiteEntryUrl } from "@/lib/suite-session";

export function SuiteGate({ children }: { children: ReactNode }) {
  const t = useT();
  const [session] = useState(() => {
    if (!inSuite()) return null;
    const s = readSuiteSession();
    return s;
  });
  const missing = inSuite() && !session;
  useEffect(() => { if (session) useWorkspace.getState().adoptSuiteSession(session); }, [session]);

  useEffect(() => {
    if (missing) window.location.replace(suiteEntryUrl());
  }, [missing]);

  if (missing) {
    return (
      <main className="grid min-h-dvh place-items-center bg-canvas p-4">
        <LoadingState label={t("suite.opening", "Opening Chats…")} />
      </main>
    );
  }
  return <>{children}</>;
}

/** The View-as banner (D-017): who is viewing, that it's read-only, and the way back. */
export function ViewAsBanner() {
  const t = useT();
  const viewOnly = useWorkspace((s) => s.viewOnly);
  const name = useWorkspace((s) => s.users.find((u) => u.id === s.me)?.name ?? "");
  const [leaving, setLeaving] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!viewOnly) return null;
  return (
    <BannerRegion
      banners={[
        {
          kind: "staff_viewing",
          title: t("suite.viewingAs", "Viewing as {name} · read-only", { name }),
          description: failed
            ? t("suite.stopViewingFailed", "Couldn't return to your account. Try again, or sign out.")
            : viewOnly.by
              ? t("suite.viewingAsBy", "Started from {name}'s account. You can look around; changes are turned off, and this visit is recorded.", { name: viewOnly.by })
              : undefined,
          action: (
            <Button
              size="sm"
              variant="secondary"
              loading={leaving}
              startIcon={<EyeSlash />}
              onClick={() => {
                setLeaving(true);
                setFailed(false);
                stopViewing().catch(() => {
                  setLeaving(false);
                  setFailed(true);
                });
              }}
            >
              {t("suite.stopViewing", "Stop viewing")}
            </Button>
          ),
        },
      ]}
    />
  );
}
