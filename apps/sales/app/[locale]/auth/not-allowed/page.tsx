"use client";

// The page someone lands on when they're signed in but Sales isn't one of their apps. It was a
// developer sign-in page with committed passwords and a paste-a-token form (SAL-001).
// Now it says what happened and offers the way forward: the suite home, which lists their apps.
import { useTranslations } from "next-intl";
import { LockKey } from "@phosphor-icons/react";
import { NoPermissionState, buttonVariants } from "@orgtik/ui";
import { SOS_URL } from "@somion/sos-bar";

export default function NotAllowed() {
  const t = useTranslations("Errors");
  return (
    <main className="grid min-h-dvh w-full place-items-center bg-canvas p-4">
      <NoPermissionState
        size="page"
        titleAs="h1"
        icon={<LockKey weight="duotone" />}
        title={t("appNoAccessTitle")}
        description={t("appNoAccessBody")}
        action={
          <a href={SOS_URL} className={buttonVariants({ variant: "primary" })}>
            {t("toSuite")}
          </a>
        }
      />
    </main>
  );
}
