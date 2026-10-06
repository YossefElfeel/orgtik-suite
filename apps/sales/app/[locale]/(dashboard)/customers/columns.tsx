"use client";

// The customers and leads list. Access is what the API says (no account, invited, can sign in), not
// a guess from the stage (SAL-075). The stage is a menu that moves the lead (D-028).
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@orgtik/ui/table";
import { Link } from "@/i18n/routing";
import CustomerAccessCell from "@/components/pages/customers/CustomerAccessCell";
import CustomerStatusCell from "@/components/pages/customers/CustomerStatusCell";
import CustomerRowActions from "@/components/pages/customers/CustomerRowActions";
import LeadSource from "@/components/pages/customers/LeadSource";
import { useCustomerDates } from "@/components/pages/customers/leads";
import type { Customer } from "@/types/customers";

type Options = { canEdit: boolean; canAssign: boolean; canDelete: boolean; showOwner: boolean };

export function useCustomerColumns({ canEdit, canAssign, canDelete, showOwner }: Options) {
  const t = useTranslations("Customers.list");
  const dates = useCustomerDates();

  return useMemo(() => {
    const cols: ColumnDef<Customer>[] = [
      {
        id: "name",
        accessorKey: "fullName",
        header: t("colName"),
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col">
            <Link href={`/customers/${row.original.id}`} className="truncate font-semibold text-fg hover:text-fg-brand hover:underline" dir="auto">
              {row.original.fullName}
            </Link>
            {row.original.companyName ? (
              <span className="truncate text-caption text-fg-muted" dir="auto">
                {row.original.companyName}
              </span>
            ) : null}
          </span>
        ),
      },
      {
        id: "contact",
        header: t("colContact"),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col text-body-sm">
            <bdi dir="ltr" className="truncate">
              {row.original.email}
            </bdi>
            {row.original.phoneNumber ? (
              <bdi dir="ltr" className="truncate text-caption text-fg-muted">
                {row.original.phoneNumber}
              </bdi>
            ) : null}
          </span>
        ),
      },
      {
        id: "stage",
        accessorKey: "status",
        header: t("colStage"),
        cell: ({ row }) => (
          <CustomerStatusCell status={row.original.status} customerId={row.original.id} name={row.original.fullName} readOnly={!canEdit} />
        ),
      },
      {
        id: "source",
        header: t("colSource"),
        enableSorting: false,
        cell: ({ row }) => <LeadSource lead={row.original} withContext />,
      },
      ...(showOwner
        ? ([
            {
              id: "owner",
              accessorKey: "salesName",
              header: t("colOwner"),
              cell: ({ row }) =>
                row.original.salesName ? (
                  <span dir="auto">{row.original.salesName}</span>
                ) : (
                  <span className="text-fg-subtle">{t("unassigned")}</span>
                ),
            },
          ] as ColumnDef<Customer>[])
        : []),
      {
        id: "access",
        accessorKey: "access",
        header: t("colAccess"),
        cell: ({ row }) => <CustomerAccessCell access={row.original.access} />,
      },
      {
        id: "created",
        accessorFn: (c) => new Date(c.createdAt).getTime(),
        header: t("colCreated"),
        meta: { numeric: true },
        cell: ({ row }) => (
          <time dateTime={row.original.createdAt} title={dates.date(row.original.createdAt)}>
            {dates.relative(row.original.createdAt)}
          </time>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("colActions")}</span>,
        enableSorting: false,
        meta: { width: "1%" },
        cell: ({ row }) => <CustomerRowActions customer={row.original} canEdit={canEdit} canAssign={canAssign} canDelete={canDelete} />,
      },
    ];
    return cols;
  }, [t, dates, canEdit, canAssign, canDelete, showOwner]);
}
