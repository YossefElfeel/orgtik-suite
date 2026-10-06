"use client";
import { Eye, Trash as Trash2 } from "@phosphor-icons/react";

import { ColumnDef } from "@tanstack/react-table";
import { IconButton } from "@/components/shared/IconButton";
import CustomAvatar from "@/components/shared/CustomAvatar";
import StatusBadge, { TaskStatus } from "@/components/shared/StatusBadge";
import { useTranslations } from "next-intl";
import { ITicket } from "@/types/ticket";
import { formatDate } from "@/utils/formateDate";
import { useDeleteTicketMutation } from "@/redux/features/ticket/ticketApi";
import { DeleteDialog } from "@/components/shared/DeleteDialog";

export const useColumns = ({
  activeTab,
}: {
  activeTab: "support-tickets" | "my-tickets";
}) => {
  const t = useTranslations("ticketsTable");
  const tDelete = useTranslations("deleteDialog");

  const supportTicketsColumns: ColumnDef<ITicket>[] = [
    {
      accessorKey: "ticketId",
      header: t("columns.ticketId"),
      cell: ({ row }) => (
        <span className="font-semibold ">{row.original.id}</span>
      ),
    },
    {
      accessorKey: "subject",
      header: t("columns.subject"),
      cell: ({ row }) => (
        <span className=" line-clamp-1 max-w-[150px] font-medium ">
          <bdi>{row.original.subject}</bdi>
        </span>
      ),
    },
    {
      accessorKey: "employeeName",
      header: t("columns.employeeName"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <CustomAvatar
            src={row.original.createdBy?.avatar}
            className="h-8 w-8"
          />
          <span className="text-[16px] font-medium text-fg">
            <bdi>{row.original.createdBy?.name}</bdi>
          </span>
        </div>
      ),
    },
    {
      accessorKey: "createdDate",
      header: t("columns.createdDate"),
      cell: ({ row }) => (
        <span className="">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      accessorKey: "emailAddress",
      header: t("columns.emailAddress"),
      cell: ({ row }) => (
        <a
          href={`mailto:${row.original.createdBy?.email}`}
          className="text-info hover:text-info"
        >
          <bdi>{row.original.createdBy?.email}</bdi>
        </a>
      ),
    },
    {
      accessorKey: "status",
      header: t("columns.status"),
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />,
    },
    {
      id: "actions",
      header: t("columns.action"),
      cell: ({ row }) => {
        const [deleteTicket, { isLoading: isDeleting }] =
          useDeleteTicketMutation();
        return (
          <div className="flex items-center gap-2">
            <IconButton
              label={t("tooltips.viewDetails")}
              variant="outline-view"
              href={`/tickets/${row.original.id}`}
            >
              <Eye className="size-4" />
            </IconButton>

            <DeleteDialog
              title={tDelete("ticket.title", { id: row.original.id, subject: row.original.subject })}
              description={tDelete("ticket.impact")}
              confirmText={tDelete("ticket.confirm")}
              onConfirm={() => deleteTicket(row.original.id).unwrap()}
              loading={isDeleting}
              trigger={
                <IconButton label={t("tooltips.deleteTicket")} variant="outline-delete">
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              }
            />
          </div>
        );
      },
    },
  ];

  const myTicketsColumns: ColumnDef<ITicket>[] = [
    {
      accessorKey: "ticketId",
      header: t("columns.ticketId"),
      cell: ({ row }) => (
        <span className="font-semibold ">{row.original.id}</span>
      ),
    },
    {
      accessorKey: "subject",
      header: t("columns.subject"),
      cell: ({ row }) => (
        <span className="line-clamp-1 max-w-[220px] font-medium ">
          <bdi>{row.original.subject}</bdi>
        </span>
      ),
    },
    {
      accessorKey: "employeeName",
      header: t("columns.assignTo"),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <CustomAvatar
            members={row.original.assignedTo.map((assignee, i) => ({
              id: i,
              name: assignee.name,
              avatar: assignee.avatar,
            }))}
            className="h-8 w-8"
          />
        </div>
      ),
    },
    {
      accessorKey: "createdDate",
      header: t("columns.createdDate"),
      cell: ({ row }) => <span>{formatDate(row.original.createdAt)}</span>,
    },
    {
      accessorKey: "status",
      header: t("columns.status"),
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />,
    },
    {
      id: "actions",
      header: t("columns.action"),
      cell: ({ row }) => (
        <IconButton
          label={t("tooltips.viewDetails")}
          variant="outline-view"
          href={`/tickets/${row.original.id}`}
        >
          <Eye className="size-4" />
        </IconButton>
      ),
    },
  ];

  return activeTab === "support-tickets"
    ? supportTicketsColumns
    : myTicketsColumns;
};
