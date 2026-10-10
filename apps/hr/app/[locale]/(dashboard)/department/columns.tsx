"use client";
import { Eye, Trash as Trash2 } from "@phosphor-icons/react";

import { ColumnDef } from "@tanstack/react-table";
import CustomAvatar from "@/components/shared/CustomAvatar";
import { IconButton } from "@/components/shared/IconButton";
import { IDepartment } from "@/types/department";
import { formatDate } from "@/utils/formateDate";
import { useDeleteDepartmentMutation } from "@/redux/features/department/departmentApi";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { useFormatter, useTranslations } from "next-intl";

export const useColumns = () => {
  const t = useTranslations("departmentPage.table");
  const tDelete = useTranslations("deleteDialog");
  const format = useFormatter();
  const columns: ColumnDef<IDepartment>[] = [
    {
      accessorKey: "name",
      header: t("columns.name"),
      cell: ({ row }) => <bdi>{row.original.name}</bdi>,
    },
    {
      accessorKey: "employeeName",
      header: t("columns.manager"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <CustomAvatar
            src={row.original.manager?.avatar}
            className="h-8 w-8"
            alt={row.original.manager?.username}
          />
          <span className="text-[16px] font-medium ">
            <bdi>{row.original.manager?.username}</bdi>
          </span>
        </div>
      ),
    },
    {
      accessorKey: "employees.length",
      header: t("columns.totalEmployees"),
      cell: ({ row }) => (
        <span className="">
          {t("employeesCount", { count: row.original.employees?.length || 0 })}
        </span>
      ),
    },
    {
      accessorKey: "absenteeRate",
      header: t("columns.absenteeRate"),
      cell: ({ row }) => (
        // The API sends the rate as a percentage (12 = 12%); a missing rate is a real 0%.
        <span>{format.number((row.original.absenteeRate ?? 0) / 100, { style: "percent", maximumFractionDigits: 1 })}</span>
      ),
    },
    {
      accessorKey: "createdDate",
      header: t("columns.creationDate"),
      cell: ({ row }) => (
        <span className="">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: "actions",
      header: t("columns.action"),
      cell: ({ row }) => {
        const [deleteDepartment, { isLoading: isDeleting }] =
          useDeleteDepartmentMutation();

        return (
          <div className="flex items-center gap-2">
            <IconButton
              label={t("tooltips.viewDetails")}
              variant="secondary"
              href={`/department/${row.original.id}`}
            >
              <Eye className="h-4 w-4" />
            </IconButton>

            <DeleteDialog
              title={tDelete("department.title", { name: row.original.name })}
              description={tDelete("department.impact", { count: row.original.employees?.length ?? 0 })}
              confirmText={tDelete("department.confirm")}
              onConfirm={() => deleteDepartment(row.original.id).unwrap()}
              loading={isDeleting}
              trigger={
                <IconButton label={t("tooltips.deleteDepartment")} variant="secondary">
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              }
            />
          </div>
        );
      },
    },
  ];

  return columns;
};
