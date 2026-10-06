"use client";

// Paid social settings, shared by every ad set unless one overrides them: objective, budget,
// audience and schedule. The budget is in the campaign's currency, read-only (MKT-011): the
// server sets it, and the currency picker that did nothing is gone.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarBlank, CurrencyCircleDollar, Target, Users } from "@phosphor-icons/react";
import { Field, MoneyField, RadioGroup } from "@orgtik/ui";
import { useCampaignStepNavigation, useStepGuard } from "@/hooks/useCampaignStepNavigation";
import { useUpdateCampaignOnboardingMutation } from "@/redux/features/campaigns/campaignsApi";
import { useProjectContext } from "@/lib/project-context";
import { useCampaignLabels } from "@/lib/campaigns/labels";
import { useDraft } from "@/lib/campaigns/use-draft";
import { scheduleErrors } from "@/lib/campaigns/schedule";
import { buildPaidSocialSettingsPayload, paidSettingsFromCampaign, type PaidObjective, type PaidSettingsValues } from "@/lib/campaigns/paid-social";
import { BUDGET_TYPE_VALUES, PAID_SOCIAL_OBJECTIVE_VALUES } from "@/constants/campaigns";
import type { BudgetType } from "@/lib/campaigns/types";
import { ChoiceChips } from "../../../shared/Choice";
import { AudienceFields, audienceErrors, type AudienceErrors } from "../../../shared/AudienceFields";
import { ScheduleFields } from "../../../shared/ScheduleFields";
import { StepFrame, StepSection } from "../../StepFrame";

export default function PaidSettingsStep() {
  const t = useTranslations("CampaignPaid");
  const tw = useTranslations("CampaignWizard");
  const labels = useCampaignLabels();
  const project = useProjectContext();
  const { campaign, campaignId, goNext } = useCampaignStepNavigation();
  const draft = useDraft<PaidSettingsValues>(paidSettingsFromCampaign(campaign));
  const v = draft.value;
  const currency = campaign?.budgetCurrency || campaign?.configuration?.budgetCurrency || project.currency;
  const [errors, setErrors] = useState<{ budget?: string; audience?: AudienceErrors; schedule?: ReturnType<typeof scheduleErrors> }>({});
  const [update, { isLoading }] = useUpdateCampaignOnboardingMutation();

  const save = async () => {
    const e: typeof errors = {};
    if (!v.budgetAmount || v.budgetAmount <= 0) e.budget = t("budgetRequired");
    const a = audienceErrors(v.audience, t);
    if (Object.keys(a).length) e.audience = a;
    const s = scheduleErrors(v, { savedStartAt: campaign?.startAt });
    if (s.start || s.end) e.schedule = s;
    setErrors(e);
    if (Object.keys(e).length || !campaignId) return false;
    try {
      await update({ campaignId, body: buildPaidSocialSettingsPayload(v) }).unwrap();
      draft.reset(v);
      return true;
    } catch {
      return false;
    }
  };
  useStepGuard(draft.dirty, save);

  return (
    <StepFrame title={t("settingsTitle")} description={t("settingsDescription")} onSubmit={() => void save().then((ok) => ok && goNext())} busy={isLoading}>
      <StepSection icon={<Target className="size-5" />} title={t("objectiveTitle")}>
        <ChoiceChips<PaidObjective>
          legend={t("objectiveTitle")}
          hideLegend
          name="paid-objective"
          value={v.objective}
          onChange={(o) => o && draft.patch({ objective: o })}
          options={PAID_SOCIAL_OBJECTIVE_VALUES.map((o) => ({ value: o, label: labels.label("paidObjective", o) }))}
        />
      </StepSection>

      <StepSection icon={<CurrencyCircleDollar className="size-5" />} title={t("budgetTitle")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <Field label={t("budgetAmount")} required error={errors.budget} description={t("currencyNote", { currency })}>
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

      <StepSection icon={<Users className="size-5" />} title={t("audienceTitle")}>
        <AudienceFields idPrefix="campaign" value={v.audience} onChange={(a) => draft.patch({ audience: a })} errors={errors.audience} />
      </StepSection>

      <StepSection icon={<CalendarBlank className="size-5" />} title={tw("schedule.title")} description={tw("schedule.optionalHint")}>
        <ScheduleFields startAt={v.startAt} endAt={v.endAt} onChange={(s) => draft.patch(s)} errors={errors.schedule} />
      </StepSection>
    </StepFrame>
  );
}
