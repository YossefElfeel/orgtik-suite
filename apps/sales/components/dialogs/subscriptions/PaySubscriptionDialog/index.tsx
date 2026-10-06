"use client";

import { useEffect, useState, type ReactElement } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Icon } from "@iconify/react";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import TextFormEle from "@/components/ui/form/text-form-element";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";
import {
  usePayCustomerSubscriptionMutation,
  usePaySubscriptionMutation,
} from "@/redux/features/subscriptions/subscriptionsApi";
import {
  paySubscriptionSchema,
  type PaySubscriptionFormValues,
} from "@/schemas/subscriptions";
import type { SubscriptionDetailDto } from "@/types/subscriptions";
import { useTranslations } from "next-intl";

type PayMode = "full" | "installment";

type Props = {
  trigger: ReactElement;
  id: string;
  subscription: SubscriptionDetailDto;
  mode?: PayMode;
};

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm text-secondary">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export default function PaySubscriptionDialog({
  trigger,
  id,
  subscription,
  mode = "full",
}: Props) {
  const t = useTranslations("subscriptions");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const { isCustomer } = useRole();
  const [payAdminSubscription, { isLoading: isAdminPaying }] =
    usePaySubscriptionMutation();
  const [payCustomerSubscription, { isLoading: isCustomerPaying }] =
    usePayCustomerSubscriptionMutation();
  const remainingAmount = Number(subscription.remainingAmount ?? 0) || 0;
  const nextInstallmentAmount = Number(
    subscription.installments?.find((item) => item.status !== "paid")?.amount,
  );
  const defaultAmount =
    mode === "installment" && Number.isFinite(nextInstallmentAmount)
      ? nextInstallmentAmount
      : remainingAmount;

  const form = useForm<PaySubscriptionFormValues>({
    resolver: zodResolver(paySubscriptionSchema),
    defaultValues: {
      amount: defaultAmount,
    },
  });

  const amount = useWatch({ control: form.control, name: "amount" });

  useEffect(() => {
    if (!open) return;
    form.reset({ amount: defaultAmount });
  }, [defaultAmount, form, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
  };

  const payLabel =
    typeof amount === "number" && !Number.isNaN(amount) && amount > 0
      ? amount.toFixed(2)
      : defaultAmount.toFixed(2);
  const isLoading = isAdminPaying || isCustomerPaying;

  const handleSubmit = async (values: PaySubscriptionFormValues) => {
    const paySubscription = isCustomer
      ? payCustomerSubscription
      : payAdminSubscription;

    await paySubscription({
      id,
      body: { amount: values.amount.toFixed(2) },
    }).unwrap();
    handleOpenChange(false);
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={t("paySubscription", { fallback: "Pay Subscription" })}
      size="xl"
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
            {t("payAmount", { amount: payLabel, fallback: `Pay ${payLabel}` })}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <div className="flex flex-col gap-5">
          <section
            className={cn(
              "flex flex-col gap-4 rounded-xl border border-border bg-muted/40 p-4",
            )}
          >
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

          <TextFormEle
            form={form}
            name="amount"
            type="number"
            label={t("paymentAmount", { fallback: "Payment Amount" })}
            placeholder={t("enterAmount", { fallback: "Enter amount" })}
            allowEmptyNumber
          />
        </div>
      </Form>
    </ReusableDialog>
  );
}
