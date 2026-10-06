"use client";

// A screen that crashed: what happened in the reader's language, a retry and the way back. The
// digest stays, small, for whoever reports it (FS-HR-3, HR-013).
import { useTranslations } from "next-intl";
import { ArrowClockwise } from "@phosphor-icons/react";
import { Button, ErrorState } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
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
            <ButtonLink href="/" variant="secondary">
              {t("toHome")}
            </ButtonLink>
          </>
        }
      />
    </main>
  );
}
