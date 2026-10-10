"use client";
import { CircleNotch as Loader2 } from "@phosphor-icons/react";

import { Button } from "@orgtik/ui";
import SelectFormEle from "@/components/ui/form/select-form-element";
import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import EmployeeComboBox from "@/components/ui/form/employee-combobox";
import { useReqWithToaster } from "@/hooks/useReqWithToaster";
import { useGetDepartmentsOptionsQuery } from "@/redux/features/department/departmentApi";
import {
  useAssignUserToTicketMutation,
  useUpdateTicketStatusMutation,
} from "@/redux/features/ticket/ticketApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, type SubmitHandler } from "react-hook-form";
import { useEffect, useMemo } from "react";
import {
  makeTicketStatusSchema,
  type TicketStatusFormValues,
} from "@/schemas/tickets/ticket.schemas";
import CardLayout from "../CardLayout";
import { ITicketDetail } from "@/types/ticket";
import { useTranslations } from "next-intl";

function TicketStatus({ ticket }: { ticket?: ITicketDetail }) {
  const t = useTranslations("ticketStatusCard");
  const reqWithToaster = useReqWithToaster();
  const ticketStatusFormSchema = useMemo(
    () => makeTicketStatusSchema({ statusRequired: t("validation.statusRequired") }),
    [t],
  );
  const [assignUserToTicket, { isLoading: isAssigningUsers }] =
    useAssignUserToTicketMutation();
  const statusOptions = [
    { value: "open", label: t("statusOptions.open") },
    { value: "in-progress", label: t("statusOptions.inProgress") },
    { value: "closed", label: t("statusOptions.closed") },
  ];

  const [updateTicketStatus, { isLoading: isUpdatingStatus }] =
    useUpdateTicketStatusMutation();
  const { data: departmentsData } = useGetDepartmentsOptionsQuery();
  const departmentsOptions =
    departmentsData?.data?.data?.map((department) => ({
      value: String(department.id),
      label: department.name,
    })) ?? [];

  const initialAssigneesOptions = useMemo(() => {
    if (!ticket?.assignees) return [];
    return ticket.assignees.map((user) => {
      const idStr =
        ticket.assignedUserIds?.find(
          (id) =>
            String(id) === String(user.employeeId) ||
            String(id) === String(user.id)
        ) || String(user.employeeId || user.id);
      return {
        value: idStr,
        label:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.username ||
          user.email ||
          t("unnamedEmployee"),
      };
    });
  }, [ticket, t]);

  const form = useForm<TicketStatusFormValues>({
    resolver: zodResolver(ticketStatusFormSchema),
    defaultValues: {
      status: "open",
      departmentId: "",
      assignees: [],
    },
  });

  const isSubmitting = isAssigningUsers || isUpdatingStatus;

  useEffect(() => {
    if (!ticket) return;

    form.reset({
      status: ticket.status,
      departmentId: String(ticket.departmentId ?? ""),
      assignees: ticket.assignedUserIds?.map((id) => String(id)) ?? [],
    });
  }, [ticket, form]);

  const onSubmit: SubmitHandler<TicketStatusFormValues> = async (values) => {
    if (!ticket?.id) return;

    await reqWithToaster(t("updating"), async () => {
      await Promise.all([
        updateTicketStatus({
          ticketId: String(ticket.id),
          status: values.status as "open" | "in-progress" | "closed",
        }).unwrap(),
        assignUserToTicket({
          ticketId: String(ticket.id),
          assignedUserIds: values.assignees,
        }).unwrap(),
      ]);
    });
  };

  return (
    <CardLayout title={t("title")}>
      <FormProvider {...form}>
        <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <SelectFormEle
            form={form}
            name="status"
            label={t("fields.changeStatus")}
            placeholder={t("fields.selectStatus")}
            options={statusOptions}
            disabled={!ticket || isSubmitting}
          />
          <ComboboxFormEle
            form={form}
            name="departmentId"
            label={t("fields.department")}
            placeholder={t("fields.selectDepartment")}
            searchPlaceholder={t("fields.searchDepartments")}
            options={departmentsOptions}
            disabled
          />
          <EmployeeComboBox
            key={ticket?.id}
            form={form}
            name="assignees"
            label={t("fields.assignTo")}
            placeholder={t("fields.selectAssignees")}
            searchPlaceholder={t("fields.searchPeople")}
            multiple
            disabled={!ticket || isSubmitting}
            initialOptions={initialAssigneesOptions}
          />
          <Button type="submit" size="lg" disabled={!ticket || isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            {t("saveChanges")}
          </Button>
        </form>
      </FormProvider>
    </CardLayout>
  );
}

export default TicketStatus;
