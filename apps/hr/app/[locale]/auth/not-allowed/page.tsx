"use client";

// No access to HR (FS-HR-1, HR-001). This page used to be a developer sign-in picker with plaintext
// account passwords in the client bundle; the test accounts live in local-dev now, and signing in
// happens in SOS. What's left is the state a person without an HR role actually needs.
import { useTranslations } from "next-intl";
import { Button, NoPermissionState } from "@orgtik/ui";
import { SOS_URL } from "@somion/sos-bar";

export default function NotAllowedPage() {
  const t = useTranslations("suite");
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-4">
      <NoPermissionState
        size="page"
        titleAs="h1"
        title={t("noAccessTitle")}
        description={t("noAccessBody")}
        action={
          <Button variant="primary" onClick={() => window.location.assign(SOS_URL)}>
            {t("toSuite")}
          </Button>
        }
      />
    </main>
  );
}
