"use client";

// A screen that crashed. It used to print the raw error message (stack-trace language, sometimes
// internal details) in English, and "Go home" reloaded the whole app. Now it says what happened in
// the reader's language, offers a retry and a way back, and keeps the technical reference (the
// digest) small, for whoever reports it.
import { useTranslations } from "next-intl";
import { ArrowClockwise } from "@phosphor-icons/react";
import { Button, ErrorState, buttonVariants } from "@orgtik/ui";
import { Link } from "@/i18n/routing";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("Errors");
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-4">
      <ErrorState
        size="page"
        titleAs="h1"
        title={t("crashTitle")}
        description={
          <>
            {t("crashBody")}
            {error.digest ? (
              <span className="mt-2 block text-caption text-fg-subtle">
                {t("reference")} <bdi dir="ltr" className="font-mono">{error.digest}</bdi>
              </span>
            ) : null}
          </>
        }
        action={
          <>
            <Button variant="primary" startIcon={<ArrowClockwise />} onClick={reset}>
              {t("retry")}
            </Button>
            <Link href="/" className={buttonVariants({ variant: "secondary" })}>
              {t("toDashboard")}
            </Link>
          </>
        }
      />
    </main>
  );
}
