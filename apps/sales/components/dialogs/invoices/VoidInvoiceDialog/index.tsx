"use client";

import { useState, type ReactElement } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import { Form } from "@/components/ui/form";
import TextFormEle from "@/components/ui/form/text-form-element";
import {
  voidInvoiceSchema,
  type VoidInvoiceFormValues,
} from "@/schemas/invoices";
import { useTranslations } from "next-intl";

type Props = {
  invoiceId: string;
  trigger: ReactElement;
  onConfirm?: (reason: string) => void | Promise<void>;
  isLoading?: boolean;
};

const defaultValues: VoidInvoiceFormValues = {
  reason: "",
};

export default function VoidInvoiceDialog({
  invoiceId,
  trigger,
  onConfirm,
  isLoading = false,
}: Props) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);

  const form = useForm<VoidInvoiceFormValues>({
    resolver: zodResolver(voidInvoiceSchema),
    defaultValues,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset(defaultValues);
    }
  };

  const handleSubmit = async (values: VoidInvoiceFormValues) => {
    await onConfirm?.(values.reason);
    handleOpenChange(false);
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={t("voidTitle", { id: invoiceId, fallback: `Void ${invoiceId}?` })}
      size="xl"
      onCancelText={tCommon("cancel", { fallback: "Cancel" })}
      onSuccessText={t("voidInvoice", { fallback: "Void Invoice" })}
      onSuccess={() => {
        void form.handleSubmit(handleSubmit)();
      }}
      isLoading={isLoading || form.formState.isSubmitting}
      successVariant="destructive"
      successClassName="bg-destructive text-white hover:bg-destructive/90 hover:text-white"
    >
      <Form {...form}>
        <form
          id={`void-invoice-${invoiceId}`}
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5"
        >
          <p className="text-base text-muted-foreground">
            {t("voidDesc", { id: invoiceId, fallback: `This will cancel invoice ${invoiceId}. The invoice stays in history as void and can't be paid. This action can't be undone.` })}
          </p>
          <TextFormEle
            form={form}
            name="reason"
            type="textarea"
            required
            label={t("reason", { fallback: "Reason" })}
            placeholder={t("voidReasonPlaceholder", { fallback: "Why is this invoice being voided?" })}
          />
        </form>
      </Form>
    </ReusableDialog>
  );
}
