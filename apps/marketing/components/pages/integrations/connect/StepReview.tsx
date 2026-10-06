"use client";

// Step 3: what will be connected and what it allows, then Connect. The review comes from preflight
// (kept in the connect session), so it survives a refresh. Finishing goes to the connected accounts
// in the reader's language; the old wizard pushed a path without the language.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { Badge, Button, Card, useFormatter } from "@orgtik/ui";
import { platformMeta } from "@/components/shared/PlatformBadge";
import { useFinishIntegrationMutation } from "@/redux/features/integrations/integrationsApi";
import { isolate } from "@/lib/bidi";
import { useCapabilityLabel } from "../shared";
import type { ConnectSession } from "./connect-session";
import { useStartConnect } from "./useStartConnect";

export function StepReview({ session, onBack, onCancel, onDone }: { session: ConnectSession; onBack: () => void; onCancel: () => void; onDone: () => void }) {
  const t = useTranslations("ConnectWizard");
  const f = useFormatter();
  const capabilityLabel = useCapabilityLabel();
  const [finish, { isLoading }] = useFinishIntegrationMutation();
  const restart = useStartConnect(session.platform);
  const [failed, setFailed] = useState(false);
  const review = session.review ?? session.data;
  const name = platformMeta(session.platform).name;
  const perms = review.permissions;
  const picked = Object.values(review.resourceSelection?.groups ?? {}).flatMap((g) => g.resources.filter((r) => r.isSelected));

  const connect = async () => {
    setFailed(false);
    try {
      await finish({ platform: session.platform, tempDataId: session.tempDataId, selections: session.selections }).unwrap();
      onDone();
    } catch {
      setFailed(true);
    }
  };

  return (
    <Card padding="lg" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-title text-fg">{t("reviewTitle")}</h2>
        {review.profile?.displayName ? (
          <p className="text-body text-fg-muted">
            {t("signedInAs", { name: isolate(review.profile.displayName) })}
            {review.profile.email ? (
              <>
                {" "}
                <bdi dir="ltr">({review.profile.email})</bdi>
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      <section aria-labelledby="review-picked" className="flex flex-col gap-3">
        <h3 id="review-picked" className="font-display text-title-sm text-fg">
          {t("reviewPicked", { count: picked.length })}
        </h3>
        <ul className="flex flex-col divide-y divide-line rounded-card border border-line">
          {picked.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <span dir="auto" className="min-w-0 truncate text-body text-fg">
                {r.displayName}
              </span>
              <span className="text-body-sm text-fg-muted">{capabilityLabel(r.capability)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="review-features" className="flex flex-col gap-3">
        <h3 id="review-features" className="font-display text-title-sm text-fg">
          {t("reviewFeatures")}
        </h3>
        <ul className="flex flex-col gap-2">
          {(review.capabilityStatuses ?? []).map((c) => {
            const ready = c.state === "satisfied";
            return (
              <li key={c.capability} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-body text-fg">{capabilityLabel(c.capability)}</span>
                <Badge tone={ready ? "success" : "neutral"} icon={ready ? <CheckCircle /> : <WarningCircle />} size="sm">
                  {ready ? t("featureOn", { count: c.selectedResources }) : c.availableResources ? t("featureNotPicked") : t("featureUnavailable")}
                </Badge>
              </li>
            );
          })}
        </ul>
      </section>

      {perms ? (
        <p className="text-body-sm text-fg-muted">
          {t("scopesGranted", { granted: f.number(perms.grantedScopesCount), required: f.number(perms.requiredScopesCount) })}
          {perms.missingScopesCount > 0 ? (
            <span className="ms-1 text-warning">{t("scopesMissing", { count: perms.missingScopesCount, platform: name })}</span>
          ) : null}
        </p>
      ) : null}

      {failed ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-field bg-danger-subtle px-3 py-2 text-body-sm text-danger">
          <span>{t("finishFailed", { platform: name })}</span>
          <Button variant="secondary" size="sm" loading={restart.busy} onClick={restart.start}>
            {t("startAgain")}
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
          {t("cancel")}
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={onBack} disabled={isLoading}>
            {t("back")}
          </Button>
          <Button variant="primary" loading={isLoading} disabled={picked.length === 0} onClick={connect}>
            {t("finish", { platform: name })}
          </Button>
        </div>
      </div>
    </Card>
  );
}
