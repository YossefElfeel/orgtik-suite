"use client";

import { useState, type ReactElement } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import { Form } from "@/components/ui/form";
import TextFormEle from "@/components/ui/form/text-form-element";
import { parseEmailsFromText } from "@/lib/custom-invoice";
import {
  sendCustomInvoiceSchema,
  type SendCustomInvoiceFormValues,
} from "@/schemas/custom-invoice";
import { useSendCustomInvoiceMutation } from "@/redux/features/invoices/invoicesApi";
import { useTranslations } from "next-intl";

type Props = {
  invoiceId: string;
  defaultEmails?: string[];
  trigger: ReactElement;
};

export default function SendCustomInvoiceDialog({
  invoiceId,
  defaultEmails = [],
  trigger,
}: Props) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [sendCustomInvoice, { isLoading }] = useSendCustomInvoiceMutation();

  const form = useForm<SendCustomInvoiceFormValues>({
    resolver: zodResolver(sendCustomInvoiceSchema),
    defaultValues: {
      emailsText: defaultEmails.join("\n"),
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset({ emailsText: defaultEmails.join("\n") });
    } else {
      form.reset({ emailsText: defaultEmails.join("\n") });
    }
  };

  const handleSubmit = async (values: SendCustomInvoiceFormValues) => {
    const emails = parseEmailsFromText(values.emailsText);
    await sendCustomInvoice({
      invoiceId,
      body: { emails },
    }).unwrap();
    handleOpenChange(false);
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={t("sendInvoiceByEmail", { fallback: "Send Invoice by Email" })}
      size="lg"
      onCancelText={tCommon("cancel", { fallback: "Cancel" })}
      onSuccessText={t("sendEmail", { fallback: "Send Email" })}
      onSuccess={() => {
        void form.handleSubmit(handleSubmit)();
      }}
      isLoading={isLoading || form.formState.isSubmitting}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4"
        >
          <p className="text-sm text-muted-foreground">
            {t("sendInvoiceEmailsDesc", { fallback: "Enter one email address per line. Duplicate addresses are removed automatically." })}
          </p>
          <TextFormEle
            form={form}
            name="emailsText"
            label={t("recipients", { fallback: "Recipients" })}
            placeholder="client@company.com"
            type="textarea"
            required
          />
        </form>
      </Form>
    </ReusableDialog>
  );
}
