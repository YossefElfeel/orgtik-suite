"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@orgtik/ui/table";
import { Link } from "@/i18n/routing";
import { SalesStatus } from "@/components/shared/SalesStatus";
import RoleBadge from "@/components/pages/user-management/RoleBadge";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { userAccess, type User } from "@/types/users";

/** Who has the CRM: name, email, the role from SOS (on the staff record) and whether they can sign in. */
export function useUserColumns(): ColumnDef<User>[] {
  const t = useTranslations("Team.users");
  const display = useCatalogDisplayText();
  return useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: "name",
        header: t("colName"),
        cell: ({ row }) => (
          <Link href={`/user-management/${row.original.id}`} dir="auto" className="font-semibold text-fg rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-focus">
            {row.original.fullName}
          </Link>
        ),
      },
      {
        id: "email",
        header: t("colEmail"),
        meta: { truncate: true },
        cell: ({ row }) => <bdi dir="ltr">{row.original.email}</bdi>,
      },
      {
        id: "role",
        header: t("colRole"),
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
      },
      {
        id: "access",
        header: t("colAccess"),
        cell: ({ row }) => <SalesStatus kind="access" value={userAccess(row.original)} size="sm" />,
      },
      {
        id: "department",
        header: t("colDepartment"),
        cell: ({ row }) => (row.original.department ? <span dir="auto">{display(row.original.department.name)}</span> : "—"),
      },
    ],
    [t, display],
  );
}
