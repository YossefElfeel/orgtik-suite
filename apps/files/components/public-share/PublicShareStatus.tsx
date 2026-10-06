"use client";

// The states a share link can be in before its content shows, for someone outside the company:
// opening, incomplete link, gone, too many tries. Each one says what happened and what to do, on
// library states, with the OrgTik mark so the page is recognisable (FILES-016).
import { useTranslations } from "next-intl";
import { ArrowClockwise, Hourglass, LinkBreak, LockKey } from "@phosphor-icons/react";
import { Button, EmptyState, Logo, Spinner } from "@orgtik/ui";

export function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-canvas px-4 py-10 text-center">
      <Logo variant="wordmark" tone="brand" className="h-6 text-fg" />
      {children}
    </main>
  );
}

export function PublicShareOpening() {
  const t = useTranslations("PublicShare");
  return (
    <CenteredState>
      <div role="status" className="flex flex-col items-center gap-3">
        <Spinner />
        <p className="text-body-sm text-fg-muted">{t("opening")}</p>
      </div>
    </CenteredState>
  );
}

export function PublicShareMissingSecret() {
  const t = useTranslations("PublicShare");
  return (
    <CenteredState>
      <EmptyState titleAs="h1" icon={<LinkBreak />} title={t("missingSecretTitle")} description={t("missingSecret")} />
    </CenteredState>
  );
}

export function PublicShareUnavailable() {
  const t = useTranslations("PublicShare");
  return (
    <CenteredState>
      <EmptyState titleAs="h1" icon={<LockKey />} title={t("unavailable")} description={t("unavailableHint")} />
    </CenteredState>
  );
}

export function PublicShareRateLimited({ onRetry }: { onRetry?: () => void }) {
  const t = useTranslations("PublicShare");
  return (
    <CenteredState>
      <EmptyState
        titleAs="h1"
        icon={<Hourglass />}
        title={t("rateLimited")}
        description={t("rateLimitedHint")}
        action={
          onRetry ? (
            <Button variant="secondary" startIcon={<ArrowClockwise />} onClick={onRetry}>
              {t("retry")}
            </Button>
          ) : null
        }
      />
    </CenteredState>
  );
}
