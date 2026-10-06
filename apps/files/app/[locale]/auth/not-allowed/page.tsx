"use client";

// FILES-004: the page someone lands on without access to Files. It used to carry a hard-coded
// sign-in token in a "Try again with token" link (a working credential in the page's source) and
// English-only copy. Now it says what happened and offers the real way forward: the suite home,
// which lists the apps they can open and where an admin can grant Files.
import { useTranslations } from "next-intl";
import { LockKey } from "@phosphor-icons/react";
import { NoPermissionState, buttonVariants } from "@orgtik/ui";
import { SOS_URL } from "@somion/sos-bar";

export default function NotAllowed() {
  const t = useTranslations("Errors");
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-4">
      <NoPermissionState
        size="page"
        titleAs="h1"
        icon={<LockKey weight="duotone" />}
        title={t("noAccessTitle")}
        description={t("noAccessBody")}
        action={
          <a href={SOS_URL} className={buttonVariants({ variant: "primary" })}>
            {t("toSuite")}
          </a>
        }
      />
    </main>
  );
}
