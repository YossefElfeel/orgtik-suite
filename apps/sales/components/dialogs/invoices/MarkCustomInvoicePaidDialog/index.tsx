"use client";

import { useState, type ReactElement } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import { Form } from "@/components/ui/form";
import TextFormEle from "@/components/ui/form/text-form-element";
import FieldsUploaderField from "@/components/ui/form/fields-uploader-field";
import { Button } from "@/components/ui/button";
import {
  markCustomInvoicePaidSchema,
  type MarkCustomInvoicePaidFormValues,
} from "@/schemas/custom-invoice";
import { useMarkCustomInvoicePaidManuallyMutation } from "@/redux/features/invoices/invoicesApi";
import { useTranslations } from "next-intl";

type Props = {
  invoiceId: string;
  amountLabel: string;
  trigger: ReactElement;
};

const defaultValues: MarkCustomInvoicePaidFormValues = {
  paidAt: "",
  paymentReference: "",
  notes: "",
};

export default function MarkCustomInvoicePaidDialog({
  invoiceId,
  amountLabel,
  trigger,
}: Props) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [markPaid, { isLoading }] = useMarkCustomInvoicePaidManuallyMutation();

  const form = useForm<MarkCustomInvoicePaidFormValues>({
    resolver: zodResolver(markCustomInvoicePaidSchema),
    defaultValues,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset(defaultValues);
    }
  };

  const handleSubmit = async (values: MarkCustomInvoicePaidFormValues) => {
    await markPaid({
      invoiceId,
      body: {
        paidAt: values.paidAt || undefined,
        paymentReference: values.paymentReference || undefined,
        notes: values.notes || undefined,
        paymentProof: values.paymentProof,
      },
    }).unwrap();
    handleOpenChange(false);
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={t("markInvoiceAsPaidManually", { fallback: "Mark invoice as paid manually" })}
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
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5"
        >
          <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3.5">
            <span className="text-sm text-secondary">{t("amount", { fallback: "Amount" })}</span>
            <span className="text-sm font-semibold text-foreground">
              {amountLabel}
            </span>
          </div>

          <TextFormEle
            form={form}
            name="paidAt"
            label={t("paidAt", { fallback: "Paid At" })}
            type="datetime-local"
            optional
          />
          <TextFormEle
            form={form}
            name="paymentReference"
            label={t("paymentReference", { fallback: "Payment Reference" })}
            placeholder={t("paymentReferencePlaceholder", { fallback: "Transaction or reference ID" })}
            optional
          />
          <TextFormEle
            form={form}
            name="notes"
            label={t("notes", { fallback: "Notes" })}
            placeholder={t("optionalPaymentNotes", { fallback: "Optional payment notes" })}
            type="textarea"
            optional
          />

          <FieldsUploaderField
            form={form}
            name="paymentProof"
            label={t("paymentProof", { fallback: "Payment Proof" })}
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            optional
          />

          <Button type="submit" className="hidden" />
        </form>
      </Form>
    </ReusableDialog>
  );
}
