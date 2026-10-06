"use client";

// A screen that crashed: what happened in the reader's language, a retry and the way back. The
// digest stays, small, for whoever reports it (CHT-023).
import Link from "next/link";
import { ArrowClockwise } from "@phosphor-icons/react";
import { Button, ErrorState, buttonVariants } from "@orgtik/ui";
import { useT } from "@/lib/i18n";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-4">
      <ErrorState
        size="page"
        titleAs="h1"
        title={t("errors.crashTitle", "This page stopped working")}
        description={
          <>
            {t("errors.crashBody", "Something went wrong on our side. Try again, or go back to the office.")}
            {error.digest ? (
              <span className="mt-2 block text-caption text-fg-subtle">
                {t("errors.reference", "Reference:")} <bdi dir="ltr" className="font-mono">{error.digest}</bdi>
              </span>
            ) : null}
          </>
        }
        action={
          <>
            <Button variant="primary" startIcon={<ArrowClockwise />} onClick={reset}>
              {t("errors.retry", "Try again")}
            </Button>
            <Link href="/hq/office" className={buttonVariants({ variant: "secondary" })}>
              {t("errors.toOffice", "Go to the office")}
            </Link>
          </>
        }
      />
    </main>
  );
}
