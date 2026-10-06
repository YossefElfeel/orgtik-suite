"use client";

// Google Search settings: the ad account, objective, budget, bidding, targeting and schedule.
// - The budget is in the ad account's currency, shown with the amount; there is no free currency
//   picker, because the server always used the account's currency (MKT-011).
// - Locations and languages are picked by name, not typed as Google ids (MKT-058).
// - The schedule is in the project's zone and checked on the fields (MKT-059).
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { skipToken } from "@reduxjs/toolkit/query";
import { CalendarBlank, CurrencyCircleDollar, MagnifyingGlass, Target, UserCircle } from "@phosphor-icons/react";
import { EmptyState, Field, MoneyField, MultiSelect, RadioGroup, Select, Skeleton } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { useCampaignStepNavigation, useStepGuard } from "@/hooks/useCampaignStepNavigation";
import { useUpdateCampaignOnboardingMutation } from "@/redux/features/campaigns/campaignsApi";
import { useGetAllIntegrationsQuery, useGetIntegrationDetailsQuery } from "@/redux/features/integrations/integrationsApi";
import { useProjectContext } from "@/lib/project-context";
import { useCampaignLabels } from "@/lib/campaigns/labels";
import { useDraft } from "@/lib/campaigns/use-draft";
import { scheduleErrors } from "@/lib/campaigns/schedule";
import { adAccountCurrency, extractIntegrations } from "@/lib/campaigns/integrations";
import { buildGoogleSearchSettingsPayload, googleSettingsFromCampaign, type GoogleSettingsValues } from "@/lib/campaigns/google-search/onboarding";
import { googleLanguageName, googleLanguageOptions, googleLocationName, googleLocationOptions } from "@/lib/campaigns/google-search/targets";
import { BUDGET_TYPE_VALUES, GOOGLE_AD_OBJECTIVE_VALUES, GOOGLE_BIDDING_STRATEGY_VALUES, GOOGLE_NETWORK_VALUES } from "@/constants/campaigns";
import type { BudgetType } from "@/lib/campaigns/types";
import type { GoogleSearchApiObjective } from "@/types/campaigns";
import { ChoiceChips } from "../../../shared/Choice";
import { ScheduleFields } from "../../../shared/ScheduleFields";
import { StepFrame, StepSection } from "../../StepFrame";

type Errors = Partial<Record<"integrationId" | "budgetAmount" | "networks" | "locations", string>> & { schedule?: ReturnType<typeof scheduleErrors> };

export default function GoogleSettingsStep() {
  const t = useTranslations("CampaignGoogle");
  const tw = useTranslations("CampaignWizard");
  const locale = useLocale();
  const labels = useCampaignLabels();
  const project = useProjectContext();
  const { campaign, campaignId, goNext } = useCampaignStepNavigation();
  const draft = useDraft<GoogleSettingsValues>(googleSettingsFromCampaign(campaign));
  const v = draft.value;
  const [errors, setErrors] = useState<Errors>({});
  const [update, { isLoading }] = useUpdateCampaignOnboardingMutation();

  const accountsQuery = useGetAllIntegrationsQuery({ platform: "GOOGLE", isConnected: true });
  const accounts = useMemo(() => extractIntegrations(accountsQuery.data), [accountsQuery.data]);
  // A saved account that is no longer connected stays listed, so the choice isn't silently lost.
  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name }));
  const selectedId = v.integrationId || (accounts.length === 1 ? accounts[0].id : "");
  const details = useGetIntegrationDetailsQuery(selectedId || skipToken);
  const { currency: accountCurrency, accountName } = adAccountCurrency(details.data);
  const currency = accountCurrency || campaign?.budgetCurrency || campaign?.configuration?.budgetCurrency || project.currency;

  const locationOptions = useMemo(() => {
    const list = googleLocationOptions(locale);
    const known = new Set(list.map((o) => o.value));
    const extra = v.locations.filter((id) => !known.has(id)).map((id) => ({ value: id, label: googleLocationName(id, locale) ?? t("locationId", { id }) }));
    return [...list, ...extra];
  }, [locale, v.locations, t]);
  const languageOptions = useMemo(() => {
    const list = googleLanguageOptions(locale);
    const known = new Set(list.map((o) => o.value));
    const extra = v.languages.filter((id) => !known.has(id)).map((id) => ({ value: id, label: googleLanguageName(id, locale) ?? t("languageId", { id }) }));
    return [...list, ...extra];
  }, [locale, v.languages, t]);

  const validate = (values: GoogleSettingsValues) => {
    const e: Errors = {};
    if (!values.integrationId) e.integrationId = t("accountRequired");
    if (!values.budgetAmount || values.budgetAmount <= 0) e.budgetAmount = t("budgetRequired");
    if (!values.networks.length) e.networks = t("networksRequired");
    if (!values.locations.length) e.locations = t("locationsRequired");
    const s = scheduleErrors({ startAt: values.startAt, endAt: values.endAt }, { savedStartAt: campaign?.startAt });
    if (s.start || s.end) e.schedule = s;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    const values = { ...v, integrationId: selectedId };
    if (!campaignId || !validate(values)) return false;
    try {
      await update({ campaignId, body: buildGoogleSearchSettingsPayload(values) }).unwrap();
      draft.reset(values);
      return true;
    } catch {
      return false;
    }
  };
  useStepGuard(draft.dirty, save);

  const loadingAccounts = accountsQuery.isLoading;

  return (
    <StepFrame title={t("settingsTitle")} description={t("settingsDescription")} onSubmit={() => void save().then((ok) => ok && goNext())} busy={isLoading} nextDisabled={!loadingAccounts && accounts.length === 0}>
      <StepSection icon={<UserCircle className="size-5" />} title={t("accountTitle")} description={t("accountDescription")}>
        {loadingAccounts ? (
          <Skeleton className="h-10 w-full" />
        ) : accountsQuery.isError ? (
          <EmptyState size="compact" title={t("accountsError")} description={tw("tryAgainLater")} />
        ) : accounts.length === 0 ? (
          <EmptyState
            size="compact"
            title={t("noAccountTitle")}
            description={t("noAccountBody")}
            action={
              <ButtonLink href="/integrations" variant="secondary">
                {t("connectAccount")}
              </ButtonLink>
            }
          />
        ) : (
          <Field label={t("account")} required error={errors.integrationId}>
            <Select value={selectedId || null} onValueChange={(id) => draft.patch({ integrationId: id ?? "" })} placeholder={t("accountPlaceholder")} options={accountOptions} />
          </Field>
        )}
      </StepSection>

      <StepSection icon={<Target className="size-5" />} title={t("objectiveTitle")}>
        <ChoiceChips<GoogleSearchApiObjective>
          legend={t("objectiveTitle")}
          hideLegend
          name="google-objective"
          value={v.objective}
          onChange={(o) => o && draft.patch({ objective: o })}
          options={GOOGLE_AD_OBJECTIVE_VALUES.map((o) => ({ value: o, label: labels.label("googleObjective", o) }))}
        />
      </StepSection>

      <StepSection icon={<CurrencyCircleDollar className="size-5" />} title={t("budgetTitle")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <Field
            label={t("budgetAmount")}
            required
            error={errors.budgetAmount}
            description={accountName ? t("currencyFromAccount", { currency, account: accountName }) : t("currencyNote", { currency })}
          >
            <MoneyField currency={currency} value={v.budgetAmount} min={0} onValueChange={(n) => draft.patch({ budgetAmount: n })} />
          </Field>
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1 text-label text-fg">{t("budgetType")}</legend>
            <RadioGroup<BudgetType>
              aria-label={t("budgetType")}
              orientation="horizontal"
              value={v.budgetType}
              onValueChange={(b) => draft.patch({ budgetType: b })}
              options={BUDGET_TYPE_VALUES.map((b) => ({ value: b, label: labels.label("budgetType", b) }))}
            />
          </fieldset>
        </div>
      </StepSection>

      <StepSection icon={<MagnifyingGlass className="size-5" />} title={t("searchTitle")}>
        <Field label={t("bidding")}>
          <Select value={v.biddingStrategy} onValueChange={(b) => b && draft.patch({ biddingStrategy: b })} options={GOOGLE_BIDDING_STRATEGY_VALUES.map((b) => ({ value: b, label: labels.label("bidding", b) }))} />
        </Field>
        <ChoiceChips<string>
          multiple
          legend={t("networks")}
          name="google-networks"
          value={v.networks}
          onChange={(n) => draft.patch({ networks: n })}
          error={errors.networks}
          options={GOOGLE_NETWORK_VALUES.map((n) => ({ value: n, label: labels.label("network", n) }))}
        />
        <Field label={t("locations")} required error={errors.locations} description={t("locationsHint")}>
          <MultiSelect value={v.locations} onValueChange={(l) => draft.patch({ locations: l })} options={locationOptions} placeholder={t("locationsPlaceholder")} emptyText={tw("noMatch")} />
        </Field>
        <Field label={t("languages")} optional description={t("languagesHint")}>
          <MultiSelect value={v.languages} onValueChange={(l) => draft.patch({ languages: l })} options={languageOptions} placeholder={t("languagesPlaceholder")} emptyText={tw("noMatch")} />
        </Field>
      </StepSection>

      <StepSection icon={<CalendarBlank className="size-5" />} title={tw("schedule.title")} description={tw("schedule.optionalHint")}>
        <ScheduleFields startAt={v.startAt} endAt={v.endAt} onChange={(s) => draft.patch(s)} errors={errors.schedule} />
      </StepSection>
    </StepFrame>
  );
}
