"use client";

// The campaign wizard's frame: the page heading, the steps (the shared Stepper: reached steps open,
// unreached ones are locked and say why; MKT-043) and the current step. It is mounted by the
// wizard's layout, so it stays while the steps change and is gone when the wizard closes.
import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ErrorState, NoPermissionState, PageHeader, Stepper } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { useMarketingRoles } from "@/lib/permissions";
import { CampaignStepNavigationProvider, useCampaignStepNavigation } from "@/hooks/useCampaignStepNavigation";

function WizardFrame({ children }: { children: ReactNode }) {
  const t = useTranslations("CampaignWizard");
  const locale = useLocale();
  const { steps, stepStates, goToStep, campaign, campaignStatus, refetchCampaign } = useCampaignStepNavigation();
  const editing = Boolean(campaign);

  let body: ReactNode = children;
  if (campaignStatus === "notFound") {
    body = (
      <ErrorState
        size="page"
        title={t("notFoundTitle")}
        description={t("notFoundBody")}
        action={
          <ButtonLink href="/campaigns" variant="secondary">
            {t("backToCampaigns")}
          </ButtonLink>
        }
      />
    );
  } else if (campaignStatus === "error") {
    body = <ErrorState size="page" title={t("loadErrorTitle")} description={t("loadErrorBody")} onRetry={refetchCampaign} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={editing ? <span dir="auto">{campaign?.name}</span> : t("newTitle")}
        description={editing ? t("editDescription") : t("newDescription")}
        breadcrumb={[{ label: t("crumbCampaigns"), href: `/${locale}/campaigns` }, { label: editing ? t("crumbEdit") : t("crumbNew") }]}
      />
      {campaignStatus === "notFound" || campaignStatus === "error" ? null : (
        <Stepper
          label={t("stepsLabel")}
          lockedHint={t("lockedHint")}
          steps={steps.map((id, i) => ({ id, label: t(`steps.${id}`), state: stepStates[i] }))}
          onStepClick={(id) => goToStep(id as (typeof steps)[number])}
        />
      )}
      {body}
    </div>
  );
}

export default function CampaignWizard({ children }: { children: ReactNode }) {
  const t = useTranslations("CampaignWizard");
  const { editCampaigns, readOnlySession } = useMarketingRoles();
  if (!editCampaigns) {
    return (
      <NoPermissionState
        size="page"
        titleAs="h1"
        title={t("noAccessTitle")}
        description={readOnlySession ? t("noAccessReadOnly") : t("noAccessBody")}
        action={
          <ButtonLink href="/campaigns" variant="secondary">
            {t("backToCampaigns")}
          </ButtonLink>
        }
      />
    );
  }
  return (
    <CampaignStepNavigationProvider>
      <WizardFrame>{children}</WizardFrame>
    </CampaignStepNavigationProvider>
  );
}
