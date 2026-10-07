"use client";
import { PencilSimple as Pencil, UserMinus } from "@phosphor-icons/react";

import { ColumnDef } from "@tanstack/react-table";
import { IconButton } from "@/components/shared/IconButton";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { IEmployee } from "@/types/employee";
import { CreateUpdateEmployeeSheet } from "@/components/sheets/CreateUpdateEmployeeSheet";
import { useRouter } from "@/i18n/routing";
import { DeleteEmployeeDialog } from "@/components/dialogs/DeleteEmployeeDialog";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[parts.length - 1]?.[0];
    if (a && b) return `${a}${b}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

export const getColumns = (t: any, employmentType: (code?: string | null) => string): ColumnDef<IEmployee>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center ps-1">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
          aria-label={t("columns.selectAll")}
          className="rounded-[4px]"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center ps-1">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t("columns.selectRow")}
          className="rounded-[4px]"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "fullName",
    header: t("columns.employeeName"),
    cell: ({ row }) => (
      <Link
        href={`/employees/${row.original.id}`}
        className="flex min-w-[180px] items-center gap-3 rounded-md py-0.5 outline-offset-2 transition-colors hover:bg-sunken/90 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={row.original.avatarUrl} alt="" />
          <AvatarFallback
            className={cn(
              "text-xs font-semibold text-white bg-muted text-muted-foreground",
            )}
          >
            {getInitials(row.original.fullName)}
          </AvatarFallback>
        </Avatar>
        <span className="text-[16px] font-medium  underline-offset-2  hover:text-fg ">
          <bdi>{row.original.fullName}</bdi>
        </span>
      </Link>
    ),
  },
  {
    accessorKey: "email",
    header: t("columns.email"),
    cell: ({ row }) => <span className=""><bdi>{row.original.email}</bdi></span>,
  },
  {
    accessorKey: "departmentName",
    header: t("columns.department"),
    cell: ({ row }) => (
      <span className="">
        {row.original.departmentName ? (
          <bdi>{row.original.departmentName}</bdi>
        ) : (
          t("noDepartment")
        )}
      </span>
    ),
  },
  {
    accessorKey: "jobTitle",
    header: t("columns.jobTitle"),
    cell: ({ row }) => <span className=""><bdi>{row.original.jobTitle}</bdi></span>,
  },
  {
    accessorKey: "employeeType",
    header: t("columns.jobType"),
    cell: ({ row }) => <span>{employmentType(row.original.employeeType)}</span>,
  },
  {
    accessorKey: "joinDate",
    header: t("columns.joinedDate"),
    cell: ({ row }) => <span className="">{row.original.joinDate}</span>,
  },
  {
    id: "actions",
    header: () => (
      <div className="text-center w-full">{t("columns.action")}</div>
    ),
    cell: ({ row }) => {
      const router = useRouter();
      const handleEdit = () => router.push(`/employees?view=table&mode=edit&employee_id=${row.original.id}&step=personal`);

      return (
        <div className="flex items-center justify-center gap-2">
          <IconButton
            label={t("tooltips.edit")}
            type="button"
            variant="outline-view"
            onClick={handleEdit}
          >
            <Pencil className="h-4 w-4" />
          </IconButton>

          <DeleteEmployeeDialog id={row.original.id}>
            <IconButton label={t("tooltips.offboard")} type="button" variant="outline-delete">
              <UserMinus className="h-4 w-4" />
            </IconButton>
          </DeleteEmployeeDialog>
        </div>
      );
    },
  },
];
