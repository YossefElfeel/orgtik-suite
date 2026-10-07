import type { ColumnDef } from "@tanstack/react-table";
import type { ISalaryUpgradeHistory, SalaryHistoryColumnsOptions } from "@/types/employee";
import { formatDate } from "@/utils/formateDate";

export function getSalaryHistoryColumns({ translate, money, currency }: SalaryHistoryColumnsOptions): ColumnDef<ISalaryUpgradeHistory>[] {
  return [
    {
      accessorKey: "recordedAt",
      header: translate("columns.date"),
      cell: ({ row }) => {
        const date = new Date(row.original.recordedAt);
        return <span className="font-medium text-foreground">{Number.isNaN(date.getTime()) ? "—" : formatDate(date)}</span>;
      },
    },
    {
      accessorKey: "baseSalary",
      header: translate("columns.baseSalary"),
      cell: ({ row }) => <bdi className="tabular-nums">{money(row.original.baseSalary, row.original.currency ?? currency)}</bdi>,
    },
    {
      accessorKey: "totalSalary",
      header: translate("columns.totalSalary"),
      cell: ({ row }) => <bdi className="tabular-nums">{money(row.original.totalSalary, row.original.currency ?? currency)}</bdi>,
    },
    {
      accessorKey: "netSalary",
      header: translate("columns.netSalary"),
      cell: ({ row }) => <bdi className="tabular-nums">{money(row.original.netSalary, row.original.currency ?? currency)}</bdi>,
    },
  ];
}
