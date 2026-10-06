"use client";

// Step 1: sign in at the platform. The button asks the API for the provider's address, keeps the
// state it carries, and leaves (useStartConnect).
import { useTranslations } from "next-intl";
import { ShieldCheck } from "@phosphor-icons/react";
import { Button, Card } from "@orgtik/ui";
import { PlatformIcon, platformMeta } from "@/components/shared/PlatformBadge";
import { useStartConnect } from "./useStartConnect";

export function StepAuthorize({ platform, onCancel }: { platform: string; onCancel: () => void }) {
  const t = useTranslations("ConnectWizard");
  const { start, busy, error } = useStartConnect(platform);
  const name = platformMeta(platform).name;

  return (
    <Card padding="lg" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="grid size-16 place-items-center rounded-card bg-sunken">
          <PlatformIcon platform={platform} className="size-9" />
        </span>
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-title text-fg">{t("authorizeTitle", { platform: name })}</h2>
          <p className="max-w-prose text-body text-fg-muted">{t("authorizeBody", { platform: name })}</p>
        </div>
        <p className="flex items-center gap-2 text-body-sm text-fg-muted">
          <ShieldCheck aria-hidden className="size-4 shrink-0 text-fg-subtle" />
          {t("authorizeSafety")}
        </p>
        {error ? (
          <p role="alert" className="rounded-field bg-danger-subtle px-3 py-2 text-body-sm text-danger">
            {error === "unsafe" ? t("unsafeAuthUrl", { platform: name }) : error === "noProject" ? t("noProjectBody") : t("startFailed", { platform: name })}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          {t("cancel")}
        </Button>
        <Button variant="primary" loading={busy} onClick={start}>
          {t("continueTo", { platform: name })}
        </Button>
      </div>
    </Card>
  );
}
