"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@orgtik/ui/table";
import { Link } from "@/i18n/routing";
import CustomerStatusCell from "@/components/pages/customers/CustomerStatusCell";
import { useRole } from "@/hooks/useRole";
import { useTeamFormat } from "@/lib/commissions";
import type { SalesmanCustomer } from "@/types/salesman";

/**
 * The salesperson's customers. Admins and managers move a lead's stage with the customers area's
 * cell, which asks for the reason when a lead is lost (D-028) and rolls back on failure.
 */
export function useSalesmanCustomerColumns(): ColumnDef<SalesmanCustomer>[] {
  const t = useTranslations("Team.salespeople");
  const f = useTeamFormat();
  const { isAdmin, isManager, canEdit } = useRole();
  const canMove = (isAdmin || isManager) && canEdit;
  return useMemo<ColumnDef<SalesmanCustomer>[]>(
    () => [
      {
        id: "name",
        header: t("colCustomer"),
        cell: ({ row }) => (
          <Link href={`/customers/${row.original.id}`} dir="auto" className="font-semibold rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-focus">
            {row.original.fullName}
          </Link>
        ),
      },
      {
        id: "company",
        header: t("colCompany"),
        meta: { truncate: true },
        cell: ({ row }) => (row.original.companyName ? <span dir="auto">{row.original.companyName}</span> : "—"),
      },
      {
        id: "email",
        header: t("colEmail"),
        cell: ({ row }) => <bdi dir="ltr">{row.original.email}</bdi>,
      },
      {
        id: "phone",
        header: t("colPhone"),
        cell: ({ row }) => (row.original.phoneNumber ? <bdi dir="ltr">{row.original.phoneNumber}</bdi> : "—"),
      },
      {
        id: "status",
        header: t("colStatus"),
        cell: ({ row }) => <CustomerStatusCell status={row.original.status} customerId={row.original.id} name={row.original.fullName} readOnly={!canMove} />,
      },
      {
        id: "created",
        header: t("colCreated"),
        cell: ({ row }) => f.date(row.original.createdAt) ?? "—",
      },
    ],
    [t, f, canMove],
  );
}
