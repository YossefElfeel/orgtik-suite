"use client";
import { useTranslations } from "next-intl";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import { SectionCard } from "@/components/shared/SectionCard";
import {
  useGetTicketUsersQuery,
  useUpdateTicketMutation,
} from "@/redux/features/tickets/ticketsApi";
import {
  ticketManageSchema,
  ticketPriorityOptions,
  type TicketManageFormValues,
} from "@/schemas/tickets";
import type { TicketDetail, TicketStatus } from "@/types/tickets";

type Props = {
  ticket: TicketDetail;
};

function getAssigneeLabel(
  firstName: string,
  lastName: string,
  username: string,
) {
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || username;
}

export default function TicketManage({ ticket }: Props) {
  const tCommon = useTranslations("common");
  const [updateTicket, { isLoading }] = useUpdateTicketMutation();
  const { data: ticketUsersResponse, isFetching: isFetchingUsers } =
    useGetTicketUsersQuery();

  const form = useForm<TicketManageFormValues>({
    resolver: zodResolver(ticketManageSchema),
    defaultValues: {
      priority: ticket.priority,
      assigneeId: ticket.assigneeId ? String(ticket.assigneeId) : "",
    },
  });

  useEffect(() => {
    form.reset({
      priority: ticket.priority,
      assigneeId: ticket.assigneeId ? String(ticket.assigneeId) : "",
    });
  }, [form, ticket.assigneeId, ticket.priority]);

  useEffect(() => {
    const subscription = form.watch((values, info) => {
      if (
        info.name === "priority" &&
        values.priority &&
        values.priority !== ticket.priority
      ) {
        updateTicket({ id: ticket.id, body: { priority: values.priority } });
      }

      if (info.name === "assigneeId" && values.assigneeId) {
        const assigneeId = Number(values.assigneeId);
        if (!assigneeId || assigneeId === ticket.assigneeId) return;
        updateTicket({ id: ticket.id, body: { assigneeId } });
      }
    });

    return () => subscription.unsubscribe();
  }, [form, ticket.assigneeId, ticket.id, ticket.priority, updateTicket]);

  const assigneeOptions = useMemo(() => {
    const users = ticketUsersResponse?.data ?? [];
    const options = users.map((user) => ({
      value: String(user.id),
      label: getAssigneeLabel(user.firstName, user.lastName, user.username),
      searchText: `${user.firstName} ${user.lastName} ${user.username}`,
    }));

    const currentAssigneeId = ticket.assigneeId
      ? String(ticket.assigneeId)
      : "";
    if (
      currentAssigneeId &&
      !options.some((option) => option.value === currentAssigneeId)
    ) {
      options.unshift({
        value: currentAssigneeId,
        label: ticket.assigneeName ?? currentAssigneeId,
        searchText: ticket.assigneeName ?? currentAssigneeId,
      });
    }

    return options;
  }, [ticket.assigneeId, ticket.assigneeName, ticketUsersResponse?.data]);

  const changeStatus = (status: TicketStatus) => {
    updateTicket({ id: ticket.id, body: { status } });
  };

  return (
    <SectionCard title={tCommon("manage")}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-foreground">
            {tCommon("status")}
          </p>
          <div className="flex flex-wrap gap-2">
            {ticket.status === "open" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  icon="solar:play-circle-linear"
                  disabled={isLoading}
                  onClick={() => changeStatus("in_progress")}
                >
                  {tCommon("start")}
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  icon="solar:check-circle-linear"
                  disabled={isLoading}
                  onClick={() => changeStatus("resolved")}
                >
                  {tCommon("resolved")}
                </Button>
              </>
            ) : null}

            {ticket.status === "in_progress" ? (
              <Button
                type="button"
                className="w-full"
                icon="solar:check-circle-linear"
                disabled={isLoading}
                onClick={() => changeStatus("resolved")}
              >
                Resolved
              </Button>
            ) : null}

            {ticket.status === "resolved" ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                icon="solar:refresh-circle-linear"
                disabled={isLoading}
                onClick={() => changeStatus("open")}
              >
                {tCommon("reopen")}
              </Button>
            ) : null}
          </div>
        </div>

        <Form {...form}>
          <form className="flex flex-col gap-5">
            <ComboboxFormEle
              form={form}
              name="priority"
              label={tCommon("priority")}
              placeholder={tCommon("selectPriority")}
              options={ticketPriorityOptions}
              disabled={isLoading}
            />
            <ComboboxFormEle
              form={form}
              name="assigneeId"
              label={tCommon("assignedTo")}
              placeholder={tCommon("selectAssignee")}
              searchPlaceholder="Search assignees..."
              options={assigneeOptions}
              disabled={isLoading}
              isSearching={isFetchingUsers}
            />
          </form>
        </Form>
      </div>
    </SectionCard>
  );
}
