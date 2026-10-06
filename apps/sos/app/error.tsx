"use client";

// A screen that crashed: what happened in the reader's language, a retry and a way home. It used
// to print the raw error message in English; the digest stays, small, for whoever reports it.
import { useTranslations } from "next-intl";
import { ArrowClockwise } from "@phosphor-icons/react";
import { Button, ErrorState, buttonVariants } from "@orgtik/ui";
import Link from "next/link";

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
              {t("toHome")}
            </Link>
          </>
        }
      />
    </main>
  );
}
