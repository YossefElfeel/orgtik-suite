"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Icon } from "@iconify/react";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { DurationSelectField } from "@/components/shared/EntitySelectFields";
import { cn } from "@/lib/utils";
import { formatShortDate } from "@/lib/format-date";
import { useRole } from "@/hooks/useRole";
import {
  useGetSubscriptionRenewalDurationsQuery,
  usePreviewCustomerSubscriptionRenewalMutation,
  usePreviewSubscriptionRenewalMutation,
  useRenewCustomerSubscriptionMutation,
  useRenewSubscriptionMutation,
} from "@/redux/features/subscriptions/subscriptionsApi";
import {
  renewSubscriptionSchema,
  type RenewSubscriptionFormValues,
} from "@/schemas/subscriptions";
import { useTranslations } from "next-intl";

type Props = {
  trigger: ReactElement;
  id: string;
};

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
        className={cn(
          emphasized
            ? "text-base font-semibold text-foreground"
            : "text-sm text-secondary",
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "text-end",
          emphasized
            ? "text-base font-semibold text-foreground"
            : mutedValue
              ? "text-sm text-secondary"
              : "text-sm font-medium text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

const defaultValues: RenewSubscriptionFormValues = {
  durationId: "",
  paymentType: "full_payment",
};

export default function RenewSubscriptionDialog({ trigger, id }: Props) {
  const t = useTranslations("subscriptions");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const { isCustomer } = useRole();
  const { data: durationsData } =
    useGetSubscriptionRenewalDurationsQuery(id, { skip: !open || !id });
  const [previewAdminRenewal, { data: adminPreflight, isLoading: isAdminPreviewing }] =
    usePreviewSubscriptionRenewalMutation();
  const [
    previewCustomerRenewal,
    { data: customerPreflight, isLoading: isCustomerPreviewing },
  ] = usePreviewCustomerSubscriptionRenewalMutation();
  const [renewAdminSubscription, { isLoading: isAdminRenewing }] =
    useRenewSubscriptionMutation();
  const [renewCustomerSubscription, { isLoading: isCustomerRenewing }] =
    useRenewCustomerSubscriptionMutation();
  const previewRenewal = isCustomer
    ? previewCustomerRenewal
    : previewAdminRenewal;
  const preflightData = isCustomer ? customerPreflight : adminPreflight;
  const isPreviewing = isAdminPreviewing || isCustomerPreviewing;
  const isRenewing = isAdminRenewing || isCustomerRenewing;

  const durations = useMemo(
    () =>
      (durationsData?.data.durations ?? []).filter(
        (duration) => duration.isActive,
      ),
    [durationsData?.data.durations],
  );

  const form = useForm<RenewSubscriptionFormValues>({
    resolver: zodResolver(renewSubscriptionSchema),
    defaultValues,
  });

  const durationId = useWatch({ control: form.control, name: "durationId" });
  const paymentType = useWatch({ control: form.control, name: "paymentType" });
  const pricing = preflightData?.data;

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues);
      return;
    }
    if (!durationId && durations[0]) {
      form.setValue("durationId", durations[0].id);
    }
  }, [durations, durationId, form, open]);

  useEffect(() => {
    if (!open || !durationId) return;
    previewRenewal({
      id,
      body: { durationId, paymentType: paymentType || "full_payment" },
    });
  }, [durationId, id, open, paymentType, previewRenewal]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
  };

  const totalLabel = pricing?.totalAmount ?? "—";

  const handleSubmit = async (values: RenewSubscriptionFormValues) => {
    const renewSubscription = isCustomer
      ? renewCustomerSubscription
      : renewAdminSubscription;

    await renewSubscription({
      id,
      body: {
        durationId: values.durationId,
        paymentType: values.paymentType,
      },
    }).unwrap();
    handleOpenChange(false);
  };

  const hasDiscount =
    pricing?.durationDiscount && pricing.durationDiscount !== "0.00";

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={t("renewSubscriptions", { fallback: "Renew Subscriptions" })}
      size="xl"
      footer={
        <>
          <DialogClose render={<Button type="button" variant="outline" />}>
            {tCommon("cancel", { fallback: "Cancel" })}
          </DialogClose>
          <Button
            type="button"
            className="min-w-40"
            disabled={isRenewing || isPreviewing || !pricing}
            onClick={form.handleSubmit(handleSubmit)}
          >
            {t("renewFor", { totalLabel, fallback: `Renew for ${totalLabel}` })}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <div className="flex flex-col gap-5">
          <p className="text-sm text-secondary">
            {t("renewDescPart1", { fallback: "Continue" })}{" "}
            <span className="font-semibold text-foreground">
              {durationsData?.data.planName ?? t("thisPlan", { fallback: "this plan" })}
            </span>{" "}
            {t("renewDescPart2", { fallback: "from the current end date. The renewal uses the current zone pricing, not the price you paid before." })}
          </p>

          <DurationSelectField
            form={form}
            name="durationId"
            enabled={open && Boolean(id)}
            subscriptionId={id}
          />

          <section className="flex flex-col gap-4 rounded-xl border border-border bg-muted/40 p-4">
            <div className="flex items-center gap-1 border-b border-border pb-2">
              <Icon
                icon="solar:document-text-linear"
                className="size-5 shrink-0 text-foreground"
              />
              <h3 className="text-base font-semibold text-foreground">
                {tCommon("dealSummary", { fallback: "Deal Summary" })}
              </h3>
            </div>

            <dl className="flex flex-col gap-3">
              <SummaryRow
                label={t("newStart", { fallback: "New Start" })}
                value={
                  pricing?.newStartDate
                    ? formatShortDate(pricing.newStartDate)
                    : "—"
                }
              />
              <SummaryRow
                label={t("newEnd", { fallback: "New End" })}
                value={
                  pricing?.newEndDate
                    ? formatShortDate(pricing.newEndDate)
                    : "—"
                }
              />
              <SummaryRow
                label={t("basePriceZone", { fallback: "Base price (zone)" })}
                value={pricing?.baseMonthlyPrice ?? "—"}
              />
              {hasDiscount ? (
                <SummaryRow
                  label={t("durationDiscountAmount", { discount: pricing?.durationDiscount, fallback: `Duration discount (${pricing?.durationDiscount}%)` })}
                  value={`- ${pricing?.durationDiscountAmount}`}
                  mutedValue
                />
              ) : null}
              <div className="h-px w-full bg-border" />
              <SummaryRow label={t("newTotal", { fallback: "New Total" })} value={totalLabel} emphasized />
            </dl>
          </section>
        </div>
      </Form>
    </ReusableDialog>
  );
}
