"use client";

import { useEffect, useState, type ReactElement } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import { CustomerSelectField } from "@/components/shared/EntitySelectFields";
import TextFormEle from "@/components/ui/form/text-form-element";
import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import { useRole } from "@/hooks/useRole";
import { useCreateTicketMutation } from "@/redux/features/tickets/ticketsApi";
import {
  getCreateTicketSchema,
  ticketPriorityOptions,
  type CreateTicketFormValues,
} from "@/schemas/tickets";
import type { CreateTicketDTO } from "@/types/tickets";
import { useTranslations } from "next-intl";

const defaultValues: CreateTicketFormValues = {
  customerId: "",
  subject: "",
  priority: "medium",
  note: "",
};

type Props = {
  trigger: ReactElement;
};

export default function OpenNewTicketDialog({ trigger }: Props) {
  const t = useTranslations("tickets");
  const tCommon = useTranslations("common");
  const { isCustomer } = useRole();
  const [open, setOpen] = useState(false);
  const [createTicket, { isLoading }] = useCreateTicketMutation();

  const form = useForm<CreateTicketFormValues>({
    resolver: zodResolver(getCreateTicketSchema(isCustomer)),
    defaultValues,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(defaultValues);
  }, [form, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset(defaultValues);
    }
  };

  const handleSubmit = async (data: CreateTicketFormValues) => {
    const payload: CreateTicketDTO = {
      subject: data.subject,
      priority: data.priority,
      ...(data.note ? { note: data.note } : {}),
      // Customers must omit `customerId`; the backend resolves it from the token.
      ...(isCustomer ? {} : { customerId: data.customerId }),
    };

    await createTicket(payload).unwrap();

    setOpen(false);
    form.reset(defaultValues);
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={t("openNewTicket", { fallback: "Open New Ticket" })}
      size="xl"
      onSuccessText={t("openTicket", { fallback: "Open Ticket" })}
      onCancelText={tCommon("cancel", { fallback: "Cancel" })}
      isLoading={isLoading}
      onSuccess={() => {
        form.handleSubmit(handleSubmit)();
      }}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5"
        >
          {isCustomer ? null : (
            <CustomerSelectField
              form={form}
              name="customerId"
              enabled={open}
              required
            />
          )}

          <TextFormEle
            form={form}
            name="subject"
            label={t("subject", { fallback: "Subject" })}
            placeholder={t("subjectPlaceholder", { fallback: "e.g. Login issue after password reset" })}
            required
          />

          <ComboboxFormEle
            form={form}
            name="priority"
            label={t("priority", { fallback: "Priority" })}
            placeholder={t("selectPriority", { fallback: "Select priority" })}
            options={ticketPriorityOptions}
          />

          <TextFormEle
            form={form}
            name="note"
            type="textarea"
            label={t("message", { fallback: "Message" })}
            placeholder={t("enterYourProblem", { fallback: "Enter Your Problem" })}
            inputClassName="min-h-40"
          />
        </form>
      </Form>
    </ReusableDialog>
  );
}
