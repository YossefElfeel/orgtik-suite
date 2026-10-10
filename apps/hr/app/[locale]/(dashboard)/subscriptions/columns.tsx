"use client";
import { Trash as Trash2 } from "@phosphor-icons/react";

import { ColumnDef } from "@tanstack/react-table";
import { IconButton } from "@/components/shared/IconButton";
import { useFormatter, useTranslations } from "next-intl";

import { Switch } from "@orgtik/ui";

export type ISubscription = {
  toolName: string;
  department: string;
  amount: number;
  billing: string;
  subscriptionDate: string;
  status: boolean;
};

export const useColumns = () => {
  const t = useTranslations("subscriptionsTable");
  const tCycles = useTranslations("subscriptionsTable.billingCycles");
  const tActions = useTranslations("actions");
  const format = useFormatter();

  const columns: ColumnDef<ISubscription>[] = [
    {
      accessorKey: "toolName",
      header: t("columns.toolName"),
      cell: ({ row }) => <bdi>{row.original.toolName}</bdi>,
    },
    {
      accessorKey: "department",
      header: t("columns.department"),
      cell: ({ row }) => <bdi>{row.original.department}</bdi>,
    },
    {
      accessorKey: "amount",
      header: t("columns.amount"),
      cell: ({ row }) => (
        <span>{format.number(row.original.amount, { style: "currency", currency: "USD" })}</span>
      ),
    },
    {
      accessorKey: "billing",
      header: t("columns.billing"),
      // The billing cycle is a code ("Monthly", "yearly"): known ones get their label.
      cell: ({ row }) => {
        const cycle = row.original.billing.trim().toLowerCase();
        return <span>{tCycles.has(cycle) ? tCycles(cycle) : row.original.billing}</span>;
      },
    },
    {
      accessorKey: "status",
      header: t("columns.status"),
      cell: ({ row }) => {
        return (
          <Switch
            aria-label={tActions("enabled")}
            checked={row.original.status}
            onCheckedChange={() => {
              console.log("checked", row.original.status);
            }}
          />
        );
      },
    },
    {
      id: "actions",
      header: t("columns.action"),
      cell: ({ row }) => (
        // No edit here: subscriptions move to the customer dashboard (HR-035), and the button
        // did nothing.
        <div className="flex items-center gap-2">
          <IconButton label={t("tooltips.delete")} variant="secondary">
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      ),
    },
  ];

  return columns;
};

export const SUBSCRIPTIONS_DATA: ISubscription[] = [
  {
    toolName: "Google Analytics",
    department: "Marketing",
    amount: 100,
    billing: "Monthly",
    subscriptionDate: "2023-01-01",
    status: false,
  },
  {
    toolName: "Google Analytics",
    department: "Marketing",
    amount: 100,
    billing: "Monthly",
    subscriptionDate: "2023-01-01",
    status: true,
  },
  {
    toolName: "Google Analytics",
    department: "Marketing",
    amount: 100,
    billing: "Monthly",
    subscriptionDate: "2023-01-01",
    status: true,
  },
  {
    toolName: "Google Analytics",
    department: "Marketing",
    amount: 100,
    billing: "Monthly",
    subscriptionDate: "2023-01-01",
    status: true,
  },
  {
    toolName: "Google Analytics",
    department: "Marketing",
    amount: 100,
    billing: "Monthly",
    subscriptionDate: "2023-01-01",
    status: true,
  },
  {
    toolName: "Google Analytics",
    department: "Marketing",
    amount: 100,
    billing: "Monthly",
    subscriptionDate: "2023-01-01",
    status: true,
  },
  {
    toolName: "Google Analytics",
    department: "Marketing",
    amount: 100,
    billing: "Monthly",
    subscriptionDate: "2023-01-01",
    status: true,
  },
  {
    toolName: "Google Analytics",
    department: "Marketing",
    amount: 100,
    billing: "Monthly",
    subscriptionDate: "2023-01-01",
    status: true,
  },
];
