"use client";
import { Plus } from "@phosphor-icons/react";

import { ReusableDialog } from "@/components/shared/ReusableDialog/reusable-dialog";
import { Button } from "@/components/ui/button";
import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import LogoUploadField from "@/components/ui/form/logo-upload-field";
import TextFormEle from "@/components/ui/form/text-form-element";
import EmployeeComboBox from "@/components/ui/form/employee-combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TextEditor } from "@/components/ui/text-editor";
import { useGetDepartmentsOptionsQuery } from "@/redux/features/department/departmentApi";
import { useCreateTicketMutation } from "@/redux/features/ticket/ticketApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  makeAddTicketSchema,
  type AddTicketFormInput,
  type AddTicketFormValues,
} from "@/schemas/tickets/ticket.schemas";

const FORM_ID = "add-new-ticket-form";

export function AddNewTicketDialog() {
  const t = useTranslations("addTicketDialog");
  const [open, setOpen] = useState(false);

  const [createTicket, { isLoading: isCreatingTicket }] =
    useCreateTicketMutation();

  const { data: departmentsData } = useGetDepartmentsOptionsQuery();
  const departmentsOptions =
    departmentsData?.data?.data?.map((department) => ({
      value: String(department.id),
      label: department.name,
    })) ?? [];

  const addTicketFormSchema = useMemo(
    () =>
      makeAddTicketSchema({
        subjectRequired: t("validation.subjectRequired"),
        departmentRequired: t("validation.departmentRequired"),
        assigneeRequired: t("validation.assigneeRequired"),
        descriptionRequired: t("validation.descriptionRequired"),
      }),
    [t],
  );

  const defaultValues: AddTicketFormInput = {
    subject: "",
    departmentId: "",
    assignTo: [],
    description: "",
    attachment: [],
  };

  const form = useForm<AddTicketFormInput, unknown, AddTicketFormValues>({
    resolver: zodResolver(addTicketFormSchema),
    defaultValues,
  });

  async function onSubmit(data: AddTicketFormValues) {
    const formData = new FormData();
    formData.append("subject", data.subject);
    formData.append("description", data.description);
    formData.append("departmentId", data.departmentId);

    formData.append(
      "assignedUserIds",
      JSON.stringify(data.assignTo.map((userId) => Number(userId))),
    );

    data.attachment.forEach((file) => {
      formData.append("attachments", file);
    });

    await createTicket(formData).unwrap();

    form.reset(defaultValues);
    setOpen(false);
  }

  return (
    <ReusableDialog
      title={t("title")}
      trigger={
        <Button type="button" size="lg">
          <Plus className="size-4.5" />
          {t("trigger")}
        </Button>
      }
      open={open}
      onOpenChange={setOpen}
      size="2xl"
      // className="max-h-[min(90vh,720px)]"
      footer={
        <>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            size="lg"
            className="flex-1"
            disabled={isCreatingTicket}
          >
            {t("submit")}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-6">
            <TextFormEle
              form={form}
              name="subject"
              label={t("subjectLabel")}
              placeholder={t("subjectPlaceholder")}
            />
            <ComboboxFormEle
              form={form}
              name="departmentId"
              label={t("departmentLabel")}
              placeholder={t("departmentPlaceholder")}
              options={departmentsOptions ?? []}
            />
            <EmployeeComboBox
              form={form}
              name="assignTo"
              label={t("assignToLabel")}
              placeholder={t("assignToPlaceholder")}
              multiple
              open={open}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("descriptionLabel")}</FormLabel>
                  <FormControl>
                    <TextEditor
                      initialHtml={field.value}
                      onHtmlChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <LogoUploadField
              name="attachment"
              label={t("attachmentLabel")}
              multiple
            />
          </div>
        </form>
      </Form>
    </ReusableDialog>
  );
}
