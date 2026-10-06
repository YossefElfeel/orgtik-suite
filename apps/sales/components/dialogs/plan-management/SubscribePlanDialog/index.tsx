"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Icon } from "@iconify/react";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import PlanOptionSelect from "@/components/dialogs/projects/AddPlanDialog/PlanOptionSelect";
import SubscribePlanCouponField from "@/components/dialogs/plan-management/SubscribePlanCouponField";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import TextFormEle from "@/components/ui/form/text-form-element";
import { useRouter } from "@/i18n/routing";
import {
  formatPlanDurationOptionLabel,
  getPlanDurationOptions,
} from "@/lib/project-plans";
import {
  useCreateCustomerSubscriptionMutation,
  usePreviewCustomerSubscriptionMutation,
} from "@/redux/features/subscriptions/subscriptionsApi";
import {
  subscribePlanSchema,
  type SubscribePlanFormValues,
} from "@/schemas/subscriptions";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import type { PlanListItem } from "@/types/plans";
import type { CustomerSubscriptionPreflight } from "@/types/subscriptions";
import { useTranslations } from "next-intl";
import { useFormatAmount } from "@/hooks/useCurrency";

export type SubscribePayMode = "pay_later" | "pay_now";

type Props = {
  plan: PlanListItem;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function parseAmount(value: string | undefined) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function SummaryRow({
  label,
  value,
  emphasized = false,
  mutedValue = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
  mutedValue?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt
        className={
          emphasized
            ? "text-base font-semibold text-foreground"
            : "text-sm text-secondary"
        }
      >
        {label}
      </dt>
      <dd
        className={
          emphasized
            ? "text-base font-semibold text-foreground"
            : mutedValue
              ? "text-sm text-secondary"
              : "text-sm font-medium text-foreground"
        }
      >
        {value}
      </dd>
    </div>
  );
}

const defaultValues: SubscribePlanFormValues = {
  projectName: "",
  projectDescription: "",
  durationId: "",
  couponCode: "",
};

function getInitialValues(
  plan: PlanListItem,
  planName: string,
): SubscribePlanFormValues {
  return {
    projectName: planName,
    projectDescription: "",
    durationId: "",
    couponCode: "",
  };
}

export default function SubscribePlanDialog({
  plan,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: Props) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string>();
  const [couponError, setCouponError] = useState<string>();
  const [displayPricing, setDisplayPricing] =
    useState<CustomerSubscriptionPreflight>();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const t = useTranslations("planManagement.subscribe");
  const tCommon = useTranslations("common");
  const displayText = useCatalogDisplayText();
  const planName = displayText(plan.name);
  const formatMoney = useFormatAmount();

  const [createCustomerSubscription, { isLoading: isSubmitting }] =
    useCreateCustomerSubscriptionMutation();
  const [previewSubscription, { isLoading: isPreviewing }] =
    usePreviewCustomerSubscriptionMutation();

  const form = useForm<SubscribePlanFormValues>({
    resolver: zodResolver(subscribePlanSchema),
    defaultValues,
  });

  const durationId = useWatch({ control: form.control, name: "durationId" });
  const couponCode = useWatch({ control: form.control, name: "couponCode" });
  const pricing = displayPricing;

  const durationOptions = useMemo(
    () =>
      getPlanDurationOptions(plan).map((option) => ({
        value: option.durationId,
        label: formatPlanDurationOptionLabel(
          option.months,
          option.discountPercentage,
        ),
      })),
    [plan],
  );

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues);
      setAppliedCoupon(undefined);
      setCouponError(undefined);
      setDisplayPricing(undefined);
      return;
    }

    form.reset(getInitialValues(plan, planName));

    const firstDuration = durationOptions[0]?.value;
    if (firstDuration) {
      form.setValue("durationId", firstDuration);
    }
  }, [durationOptions, form, open, plan, planName]);

  useEffect(() => {
    if (!open || !durationId) return;

    previewSubscription({
      planId: plan.id,
      durationId,
      couponCode: appliedCoupon,
    })
      .unwrap()
      .then((result) => setDisplayPricing(result.data))
      .catch(() => {});
  }, [appliedCoupon, durationId, open, plan.id, previewSubscription]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(nextOpen);
    } else {
      setUncontrolledOpen(nextOpen);
    }
  };

  const handleApplyCoupon = async () => {
    const code = couponCode?.trim();
    if (!code) {
      setCouponError(t("enterCoupon"));
      return;
    }

    if (!durationId) {
      setCouponError(t("selectDurationFirst"));
      return;
    }

    try {
      const result = await previewSubscription({
        planId: plan.id,
        durationId,
        couponCode: code,
      }).unwrap();
      setDisplayPricing(result.data);
      setAppliedCoupon(code);
      setCouponError(undefined);
    } catch {
      setCouponError(t("invalidCoupon"));
    }
  };

  const handleSubscribe = async (payMode: SubscribePayMode) => {
    const valid = await form.trigger();
    if (!valid || !durationId) return;

    const values = form.getValues();

    const result = await createCustomerSubscription({
      projectName: values.projectName.trim(),
      projectDescription: values.projectDescription.trim(),
      planId: plan.id,
      durationId,
      couponCode: appliedCoupon,
      paymentMode: payMode,
    }).unwrap();

    handleOpenChange(false);

    if (payMode === "pay_now") {
      router.push(`/subscriptions/${result.data.subscriptionId}`);
      return;
    }

    router.push("/subscriptions");
  };

  const pricingCurrency = pricing?.currency || "USD";
  const totalLabel = pricing
    ? formatMoney(pricing.totalAmount, pricingCurrency)
    : "—";
  const hasDurationDiscount = parseAmount(pricing?.durationDiscount) > 0;
  const hasCouponDiscount = parseAmount(pricing?.couponDiscountAmount) > 0;
  const appliedCouponDiscountLabel =
    appliedCoupon && hasCouponDiscount
      ? `− ${formatMoney(pricing?.couponDiscountAmount ?? "0", pricingCurrency)}`
      : undefined;

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={t("subscribeTo", { planName })}
      size="xl"
      footer={
        <>
          <DialogClose render={<Button type="button" variant="outline" />}>
            {tCommon("cancel")}
          </DialogClose>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting || isPreviewing || !pricing}
            onClick={() => handleSubscribe("pay_later")}
          >
            {t("payLater")}
          </Button>
          <Button
            type="button"
            className="min-w-44"
            disabled={isSubmitting || isPreviewing || !pricing}
            onClick={() => handleSubscribe("pay_now")}
          >
            {t("subscribeAndPay", { total: totalLabel })}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <div className="flex flex-col gap-5">
          <TextFormEle
            form={form}
            name="projectName"
            label={t("projectName")}
            placeholder={t("projectNamePlaceholder")}
            required
          />
          <TextFormEle
            form={form}
            name="projectDescription"
            label={t("projectDesc")}
            placeholder={t("projectDescPlaceholder")}
            type="textarea"
            required
          />

          <PlanOptionSelect
            label={tCommon("duration")}
            required
            value={durationId}
            options={durationOptions}
            placeholder={tCommon("selectDuration")}
            startIcon={
              <Icon
                icon="solar:clock-circle-linear"
                className="size-4 text-secondary"
              />
            }
            onValueChange={(value) => {
              form.setValue("durationId", value, { shouldValidate: true });
              setAppliedCoupon(undefined);
              setCouponError(undefined);
            }}
          />

          <SubscribePlanCouponField
            form={form}
            appliedCoupon={appliedCoupon}
            couponError={couponError}
            appliedCouponDiscountLabel={appliedCouponDiscountLabel}
            isApplying={isPreviewing}
            applyDisabled={!durationId}
            onApply={handleApplyCoupon}
          />

          <section className="flex flex-col gap-4 rounded-xl border border-border bg-muted/40 p-4">
            <div className="flex items-center gap-1 border-b border-border pb-2">
              <Icon
                icon="solar:document-text-linear"
                className="size-5 shrink-0 text-foreground"
              />
              <h3 className="text-base font-semibold text-foreground">
                {tCommon("summary")}
              </h3>
            </div>

            <dl className="flex flex-col gap-3">
              <SummaryRow
                label={
                  pricing?.months
                    ? `${formatMoney(pricing.monthlyPrice, pricingCurrency)} x ${pricing.months} ${tCommon("months")}`
                    : t("planTotal")
                }
                value={formatMoney(pricing?.baseAmount ?? "0", pricingCurrency)}
              />
              {hasDurationDiscount ? (
                <SummaryRow
                  label={t("durationDiscount", { percent: pricing?.durationDiscount ?? "0" })}
                  value={`− ${formatMoney(pricing?.durationDiscountAmount ?? "0", pricingCurrency)}`}
                  mutedValue
                />
              ) : null}
              {hasCouponDiscount ? (
                <SummaryRow
                  label={t("couponDiscount", { percent: pricing?.couponDiscount ?? "0" })}
                  value={`− ${formatMoney(pricing?.couponDiscountAmount ?? "0", pricingCurrency)}`}
                  mutedValue
                />
              ) : null}
              <div className="h-px w-full bg-border" />
              <SummaryRow label={tCommon("total")} value={totalLabel} emphasized />
            </dl>
          </section>

          <p className="text-xs leading-5 text-secondary">
            {t("subscribeDisclaimer")}
          </p>
        </div>
      </Form>
    </ReusableDialog>
  );
}
