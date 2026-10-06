"use client";

import { useState, type ReactElement } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import { useRole } from "@/hooks/useRole";
import {
  useCancelCustomerSubscriptionMutation,
  useCancelSubscriptionMutation,
} from "@/redux/features/subscriptions/subscriptionsApi";
import {
  cancelSubscriptionReasonOptions,
  cancelSubscriptionSchema,
  type CancelSubscriptionFormValues,
} from "@/schemas/subscriptions";
import { useTranslations } from "next-intl";

type Props = {
  trigger: ReactElement;
  id: string;
};

const defaultValues: CancelSubscriptionFormValues = {
  reason: "customer_requested",
};

export default function CancelSubscriptionDialog({ trigger, id }: Props) {
  const [open, setOpen] = useState(false);
  const { isCustomer } = useRole();
  const [cancelAdminSubscription, { isLoading: isAdminCancelling }] =
    useCancelSubscriptionMutation();
  const [cancelCustomerSubscription, { isLoading: isCustomerCancelling }] =
    useCancelCustomerSubscriptionMutation();
  const isLoading = isAdminCancelling || isCustomerCancelling;
  const t = useTranslations("subscriptions");
  const tCommon = useTranslations("common");

  const form = useForm<CancelSubscriptionFormValues>({
    resolver: zodResolver(cancelSubscriptionSchema),
    defaultValues,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset(defaultValues);
    }
  };

  const handleSubmit = async (values: CancelSubscriptionFormValues) => {
    const reason =
      cancelSubscriptionReasonOptions.find(
        (option) => option.value === values.reason,
      )?.label ?? values.reason;

    const cancelSubscription = isCustomer
      ? cancelCustomerSubscription
      : cancelAdminSubscription;

    await cancelSubscription({ id, body: { reason } }).unwrap();
    handleOpenChange(false);
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={t("cancelSubscriptions", { fallback: "Cancel Subscriptions" })}
      size="xl"
      footer={
        <>
          <DialogClose render={<Button type="button" variant="outline" />}>
            {t("keepActive", { fallback: "Keep Active" })}
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            className="min-w-40 bg-red text-white hover:bg-red/90 hover:text-white"
            disabled={isLoading}
            onClick={form.handleSubmit(handleSubmit)}
          >
            {t("cancelSubscriptions", { fallback: "Cancel Subscriptions" })}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-red/30 bg-red/10 px-4 py-3.5">
            <p className="text-sm text-red">
              <span className="font-semibold">{t("cancelling", { fallback: "Cancelling" })}</span> {t("cancellingDesc", { fallback: "stops further installments and turns off auto-renew. The subscription remains visible in history. Refunds, if any, are handled separately." })}
            </p>
          </div>

          <ComboboxFormEle
            form={form}
            name="reason"
            label={t("reason", { fallback: "Reason" })}
            placeholder={t("selectReason", { fallback: "Select reason" })}
            options={cancelSubscriptionReasonOptions}
          />
        </div>
      </Form>
    </ReusableDialog>
  );
}
