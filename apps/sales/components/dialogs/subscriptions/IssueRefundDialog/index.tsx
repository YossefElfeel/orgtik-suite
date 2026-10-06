"use client";

import { useEffect, useState, type ReactElement } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Icon } from "@iconify/react";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import RefundMethodCard from "@/components/dialogs/subscriptions/RefundMethodCard";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import TextFormEle from "@/components/ui/form/text-form-element";
import { formStyles } from "@/lib/form-styles";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/useRole";
import {
  useRefundCustomerSubscriptionMutation,
  useRefundSubscriptionMutation,
} from "@/redux/features/subscriptions/subscriptionsApi";
import {
  issueRefundSchema,
  refundMethodOptions,
  type IssueRefundFormValues,
  type RefundMethod,
} from "@/schemas/subscriptions";
import type { SubscriptionDetailDto } from "@/types/subscriptions";
import { useTranslations } from "next-intl";

type Props = {
  trigger: ReactElement;
  id: string;
  subscription: SubscriptionDetailDto;
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm text-secondary">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

const defaultValues: IssueRefundFormValues = {
  amount: 0,
  refundTo: "bank_transfer",
  iban: "",
  cardNumber: "",
  destination: "",
  internalNote: "",
};

export default function IssueRefundDialog({ trigger, id, subscription }: Props) {
  const t = useTranslations("subscriptions");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const { isCustomer } = useRole();
  const [refundAdminSubscription, { isLoading: isAdminRefunding }] =
    useRefundSubscriptionMutation();
  const [refundCustomerSubscription, { isLoading: isCustomerRefunding }] =
    useRefundCustomerSubscriptionMutation();
  const isLoading = isAdminRefunding || isCustomerRefunding;

  const form = useForm<IssueRefundFormValues>({
    resolver: zodResolver(issueRefundSchema),
    defaultValues,
  });

  const refundTo = useWatch({ control: form.control, name: "refundTo" });

  useEffect(() => {
    if (!open) return;
    form.reset({
      ...defaultValues,
      amount: Number(subscription.paidAmount),
    });
  }, [form, open, subscription.paidAmount]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
  };

  const handleSelectMethod = (method: RefundMethod) => {
    form.setValue("refundTo", method, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleFullRefund = () => {
    form.setValue("amount", Number(subscription.paidAmount), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleSubmit = async (values: IssueRefundFormValues) => {
    const refundSubscription = isCustomer
      ? refundCustomerSubscription
      : refundAdminSubscription;

    await refundSubscription({
      id,
      body: {
        amount: values.amount.toFixed(2),
        refundTo: values.refundTo,
        note: values.internalNote?.trim() || undefined,
      },
    }).unwrap();
    handleOpenChange(false);
  };

  const paidLabel = subscription.paidAmount;

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={t("issueRefund", { fallback: "Issue Refund" })}
      size="3xl"
      footer={
        <>
          <DialogClose render={<Button type="button" variant="outline" />}>
            {tCommon("cancel", { fallback: "Cancel" })}
          </DialogClose>
          <Button
            type="button"
            className="min-w-40"
            disabled={isLoading}
            onClick={form.handleSubmit(handleSubmit)}
          >
            {t("issueRefund", { fallback: "Issue Refund" })}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <div className="flex flex-col gap-5">
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
                label={t("totalPrice", { fallback: "Total Price" })}
                value={subscription.totalAmount}
              />
              <SummaryRow
                label={t("paidSoFar", { fallback: "Paid So Far" })}
                value={subscription.paidAmount}
              />
              <SummaryRow
                label={t("remaining", { fallback: "Remaining" })}
                value={subscription.remainingAmount}
              />
            </dl>
          </section>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={formStyles.label}>{t("refundAmount", { fallback: "Refund Amount" })}</span>
              <button
                type="button"
                onClick={handleFullRefund}
                className="text-sm font-medium text-primary hover:underline"
              >
                {t("fullRefund", { amount: paidLabel, fallback: `Full Refund (${paidLabel})` })}
              </button>
            </div>
            <TextFormEle
              form={form}
              name="amount"
              type="number"
              placeholder={t("enterAmount", { fallback: "Enter amount" })}
              allowEmptyNumber
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className={formStyles.label}>
              {t("refundTo", { fallback: "Refund To" })} <span className="text-red">*</span>
            </span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {refundMethodOptions.map((option) => (
                <RefundMethodCard
                  key={option.value}
                  title={t(option.value, { fallback: option.title })}
                  description={t(`${option.value}Desc`, { fallback: option.description })}
                  icon={option.icon}
                  selected={refundTo === option.value}
                  className={cn(option.value === "other" && "sm:col-span-2")}
                  onSelect={() => handleSelectMethod(option.value)}
                />
              ))}
            </div>
          </div>

          {refundTo === "bank_transfer" ? (
            <TextFormEle
              form={form}
              name="iban"
              label={
                <>
                  {t("ibanOrAccount", { fallback: "IBAN or Account Number" })} <span className="text-red">*</span>
                </>
              }
              placeholder="SA00 0000 0000 0000 0000 0000"
            />
          ) : null}

          {refundTo === "credit_card" ? (
            <p className="text-caption text-fg-muted">{t("refundToCard")}</p>
          ) : null}

          {refundTo === "other" ? (
            <TextFormEle
              form={form}
              name="destination"
              label={
                <>
                  {t("destination", { fallback: "Destination" })} <span className="text-red">*</span>
                </>
              }
              placeholder={t("destinationPlaceholder", { fallback: "e.g. PayPal account, check #, Cash" })}
            />
          ) : null}

          <TextFormEle
            form={form}
            name="internalNote"
            type="textarea"
            label={t("internalNote", { fallback: "Internal Note" })}
            placeholder={t("internalNotePlaceholder", { fallback: "Why is this refund being issued?" })}
            optional
          />
        </div>
      </Form>
    </ReusableDialog>
  );
}
