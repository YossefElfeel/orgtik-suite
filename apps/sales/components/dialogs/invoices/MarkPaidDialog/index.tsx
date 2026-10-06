"use client";

import { useState, type ReactElement } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import { Form } from "@/components/ui/form";
import TextFormEle from "@/components/ui/form/text-form-element";
import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import {
  markPaidPaymentMethodOptions,
  markPaidSchema,
  type MarkPaidFormValues,
} from "@/schemas/invoices";
import { useTranslations } from "next-intl";

type Props = {
  invoiceId: string;
  amountLabel: string;
  trigger: ReactElement;
  onConfirm?: (values: MarkPaidFormValues) => void | Promise<void>;
  isLoading?: boolean;
};

const defaultValues: MarkPaidFormValues = {
  paymentMethod: "bank_transfer",
  transferReference: "",
  cardNumber: "",
  paymentDetails: "",
};

export default function MarkPaidDialog({
  invoiceId,
  amountLabel,
  trigger,
  onConfirm,
  isLoading = false,
}: Props) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);

  const form = useForm<MarkPaidFormValues>({
    resolver: zodResolver(markPaidSchema),
    defaultValues,
  });

  const paymentMethod = useWatch({
    control: form.control,
    name: "paymentMethod",
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset(defaultValues);
    }
  };

  const handleSubmit = async (values: MarkPaidFormValues) => {
    await onConfirm?.(values);
    handleOpenChange(false);
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={t("markInvoiceAsPaid", { fallback: "Mark this invoice as paid?" })}
      size="xl"
      onCancelText={tCommon("cancel", { fallback: "Cancel" })}
      onSuccessText={t("markAsPaidAmount", { amount: amountLabel, fallback: `Mark as paid (${amountLabel})` })}
      onSuccess={() => {
        void form.handleSubmit(handleSubmit)();
      }}
      isLoading={isLoading || form.formState.isSubmitting}
      className="sm:max-w-[630px]"
    >
      <Form {...form}>
        <form
          id={`mark-paid-${invoiceId}`}
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5"
        >
          <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3.5">
            <span className="text-sm text-secondary">{t("amount", { fallback: "Amount" })}</span>
            <span className="text-sm font-semibold text-foreground">
              {amountLabel}
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            {t("setsPaidAtToNow", { fallback: "Sets paid at to now. You can revert this later if it was a mistake." })}
          </p>

          <ComboboxFormEle
            form={form}
            name="paymentMethod"
            label={t("paymentMethod", { fallback: "Payment Method" })}
            placeholder={t("selectPaymentMethod", { fallback: "Select payment method" })}
            options={markPaidPaymentMethodOptions}
          />

          {paymentMethod === "bank_transfer" ? (
            <TextFormEle
              form={form}
              name="transferReference"
              label={
                <>
                  {t("transferReference", { fallback: "Transfer Reference / IBAN" })}{" "}
                  <span className="text-destructive">*</span>
                </>
              }
              placeholder={t("ibanPlaceholder", { fallback: "e.g. 0089 3704 0044 0532 0133 00" })}
            />
          ) : null}

          {paymentMethod === "credit_card" ? (
            <TextFormEle
              form={form}
              name="cardNumber"
              label={t("cardLast4")}
              placeholder="2456"
            />
          ) : null}

          {paymentMethod === "other" ? (
            <TextFormEle
              form={form}
              name="paymentDetails"
              label={t("paymentDetails", { fallback: "Payment Details" })}
              placeholder={t("paymentDetailsPlaceholder", { fallback: "Reference or note" })}
            />
          ) : null}
        </form>
      </Form>
    </ReusableDialog>
  );
}
