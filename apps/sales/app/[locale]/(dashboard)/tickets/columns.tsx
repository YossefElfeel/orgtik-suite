"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@/i18n/routing";
import TicketPriorityCell from "@/components/pages/tickets/TicketPriorityCell";
import TicketStatusCell from "@/components/pages/tickets/TicketStatusCell";
import { formatTimeAgo } from "@/lib/format-date";
import type { Ticket } from "@/types/tickets";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

export function useCustomerTicketColumns(): ColumnDef<Ticket>[] {
  const t = useTranslations("tickets");

  return useMemo(() => [
  {
    accessorKey: "subject",
    header: t("columnSubject"),
    cell: ({ row }) => (
      <Link
        href={`/tickets/${row.original.id}`}
        className="max-w-100 truncate font-medium text-foreground transition-colors hover:text-primary"
      >
        {row.original.subject}
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: t("columnStatus"),
    cell: ({ row }) => <TicketStatusCell status={row.original.status} />,
  },
  {
    accessorKey: "priority",
    header: t("columnPriority"),
    cell: ({ row }) => <TicketPriorityCell priority={row.original.priority} />,
  },
  {
    accessorKey: "createdAt",
    header: t("columnOpen"),
    cell: ({ row }) => (
      <span className="text-secondary">
        {formatTimeAgo(row.original.createdAt)}
      </span>
    ),
  },
  ], [t]);
}

export function useTicketColumns(): ColumnDef<Ticket>[] {
  const t = useTranslations("tickets");
  const tCommon = useTranslations("common");

  return useMemo(() => [
  {
    accessorKey: "subject",
    header: t("columnSubject"),
    cell: ({ row }) => (
      <Link
        href={`/tickets/${row.original.id}`}
        className="max-w-55 truncate text-secondary transition-colors hover:text-primary"
      >
        {row.original.subject}
      </Link>
    ),
  },
  {
    accessorKey: "customerName",
    header: t("columnCustomerName"),
    cell: ({ row }) => (
      <span className="font-semibold">{row.original.customerName}</span>
    ),
  },
  {
    accessorKey: "status",
    header: t("columnStatus"),
    cell: ({ row }) => <TicketStatusCell status={row.original.status} />,
  },
  {
    accessorKey: "priority",
    header: t("columnPriority"),
    cell: ({ row }) => <TicketPriorityCell priority={row.original.priority} />,
  },
  {
    accessorKey: "assigneeName",
    header: t("columnAssignedTo"),
    cell: ({ row }) => row.original.assigneeName ?? "-",
  },
  {
    accessorKey: "createdAt",
    header: t("columnOpen"),
    cell: ({ row }) => (
      <span className="text-secondary">
        {formatTimeAgo(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "actions",
    header: t("columnActions"),
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost-primary"
          size="icon"
          icon="solar:eye-linear"
          aria-label={tCommon("view", { fallback: "View" })}
          nativeButton={false}
          render={<Link href={`/tickets/${row.original.id}`} />}
        />
      </div>
    ),
  },
  ], [t, tCommon]);
}
