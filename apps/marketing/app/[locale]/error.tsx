"use client";

// A screen that crashed. It used to print the raw error message in English, and "Go Home" sent
// people to the onboarding page outside their language (MKT-041). Now it says what happened in the
// reader's language, offers a retry and a way back, and keeps only the technical reference.
import { useTranslations } from "next-intl";
import { ArrowClockwise } from "@phosphor-icons/react";
import { Button, ErrorState, buttonVariants } from "@orgtik/ui";
import { Link } from "@/i18n/routing";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("Errors");
  return (
    <main className="grid min-h-dvh w-full place-items-center bg-canvas p-4">
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
            <Link href="/dashboard" className={buttonVariants({ variant: "secondary" })}>
              {t("toDashboard")}
            </Link>
          </>
        }
      />
    </main>
  );
}
