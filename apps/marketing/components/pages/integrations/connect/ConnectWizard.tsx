"use client";

// Connect an account in three steps (FS-MKT-11): sign in at the platform, choose the pages and ad
// accounts, review and connect. The step is the address (/wizard/:platform/:step), and steps 2 and
// 3 carry the connect session's temp data id (?session=), so a refresh resumes where it was
// (MKT-020). Cancel leaves the wizard, Back goes one step back, and finishing lands on the
// connected accounts in the same language (MKT-062). The old wizard kept everything in memory.
import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowCounterClockwise } from "@phosphor-icons/react";
import { Button, ErrorState, NoPermissionState, PageHeader, Spinner, Stepper, type Step } from "@orgtik/ui";
import { useRouter } from "@/i18n/routing";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { platformMeta } from "@/components/shared/PlatformBadge";
import { useMarketingRoles } from "@/lib/permissions";
import { clearSession, loadSession, type ConnectSession } from "./connect-session";
import { OAuthReturn } from "./OAuthReturn";
import { StepAuthorize } from "./StepAuthorize";
import { StepResources } from "./StepResources";
import { StepReview } from "./StepReview";
import { useStartConnect } from "./useStartConnect";

export type WizardStep = 1 | 2 | 3;
const IDS = ["authorize", "resources", "review"] as const;

export function ConnectWizard({ platform, step }: { platform: string; step: WizardStep }) {
  const t = useTranslations("ConnectWizard");
  const locale = useLocale();
  const can = useMarketingRoles();
  const router = useRouter();
  const search = useSearchParams();
  const P = platform.toUpperCase();
  const name = platformMeta(P).name;
  const sessionId = search.get("session");

  // The provider's return carries a code (or an error); remember it was there, because the address
  // is cleaned before the exchange ends.
  const hasReturn = Boolean(search.get("code") || search.get("oauth_verifier") || search.get("error"));
  const [returning] = useState(hasReturn);

  // sessionStorage exists only in the browser: read it after mounting, so both renders match.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const session: ConnectSession | null = mounted ? loadSession(sessionId, P) : null;

  // Step 3 without a review yet goes back to step 2 of the same session.
  const needsResources = Boolean(mounted && step === 3 && session && !session.review);
  const tempDataId = session?.tempDataId;
  useEffect(() => {
    if (needsResources && tempDataId) router.replace(`/integrations/wizard/${P}/2?session=${encodeURIComponent(tempDataId)}`);
  }, [needsResources, P, router, tempDataId]);

  const go = (n: WizardStep) => {
    if (n === 1) router.push(`/integrations/wizard/${P}/1`);
    else if (session) router.push(`/integrations/wizard/${P}/${n}?session=${encodeURIComponent(session.tempDataId)}`);
  };
  const cancel = () => {
    clearSession(session?.tempDataId);
    router.push("/integrations");
  };

  const reached = (n: number) => n === 1 || (n === 2 && Boolean(session)) || (n === 3 && Boolean(session?.review));
  const steps: Step[] = IDS.map((id, i) => {
    const n = i + 1;
    return {
      id,
      label: t(`step_${id}`),
      state: n === step ? "current" : n < step && reached(n) ? "complete" : "upcoming",
    };
  });

  const header = (
    <PageHeader
      title={t("title", { platform: name })}
      breadcrumb={[{ label: t("crumbAccounts"), href: `/${locale}/integrations` }, { label: t("crumbConnect", { platform: name }) }]}
    />
  );

  if (!can.manageIntegrations) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <NoPermissionState title={t("noPermission")} description={t("noPermissionBody")} />
      </div>
    );
  }

  let body: ReactNode;
  if (step === 1) {
    body = <StepAuthorize platform={P} onCancel={cancel} />;
  } else if (step === 2 && returning && !sessionId) {
    body = <OAuthReturn platform={P} />;
  } else if (!mounted || needsResources) {
    body = (
      <div className="grid place-items-center py-16">
        <Spinner size="lg" label={t("loading")} />
      </div>
    );
  } else if (!session) {
    body = <SessionMissing platform={P} />;
  } else if (step === 2) {
    body = <StepResources session={session} onBack={() => go(1)} onCancel={cancel} onDone={() => go(3)} />;
  } else {
    body = (
      <StepReview
        session={session}
        onBack={() => go(2)}
        onCancel={cancel}
        onDone={() => {
          clearSession(session.tempDataId);
          router.push("/integrations");
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {header}
      <Stepper
        label={t("stepsLabel")}
        steps={steps}
        lockedHint={t("lockedHint")}
        onStepClick={(id) => {
          const n = (IDS.indexOf(id as (typeof IDS)[number]) + 1) as WizardStep;
          if (n !== step && reached(n)) go(n);
        }}
      />
      <div className="mx-auto w-full max-w-3xl">{body}</div>
    </div>
  );
}

/** A refresh in another tab, or a session that's gone: start a new connect, never resend a code. */
function SessionMissing({ platform }: { platform: string }) {
  const t = useTranslations("ConnectWizard");
  const restart = useStartConnect(platform);
  const name = platformMeta(platform).name;
  return (
    <ErrorState
      title={t("sessionMissingTitle")}
      description={t("sessionMissingBody", { platform: name })}
      action={
        <div className="flex flex-wrap items-center justify-center gap-2">
          <ButtonLink href="/integrations" variant="secondary">
            {t("backToAccounts")}
          </ButtonLink>
          <Button variant="primary" startIcon={<ArrowCounterClockwise />} loading={restart.busy} onClick={restart.start}>
            {t("startAgain")}
          </Button>
        </div>
      }
    />
  );
}
