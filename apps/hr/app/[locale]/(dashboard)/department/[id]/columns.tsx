"use client";
import { Eye, Trash as Trash2, User, UserCheck } from "@phosphor-icons/react";

import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useEmploymentTypeLabel } from "@/hooks/useEmploymentTypeLabel";
import { IconButton } from "@/components/shared/IconButton";
import CustomAvatar from "@/components/shared/CustomAvatar";
import { IEmployee } from "@/types/employee";
import { formatDate } from "@/utils/formateDate";
import { useReqWithToaster } from "@/hooks/useReqWithToaster";
import {
  useAssignManagerMutation,
  useRemoveEmployeeMutation,
} from "@/redux/features/department/departmentApi";
import { DeleteDialog } from "@/components/shared/DeleteDialog";

export const useColumns = (departmentId: string, managerUserId?: string) => {
  const tActions = useTranslations("actions");
  const tDelete = useTranslations("deleteDialog");
  const tEmployees = useTranslations("employeeTable.columns");
  const employmentType = useEmploymentTypeLabel();
  const t = useTranslations("departmentPage");
  const reqWithToaster = useReqWithToaster();
  const columns: ColumnDef<IEmployee>[] = [
    {
      accessorKey: "employeeName",
      header: tEmployees("employeeName"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <CustomAvatar
            src={row.original.user?.avatar || ""}
            className="h-8 w-8"
            alt={row.original.user?.username || ""}
          />
          <span className=" font-medium ">
            <bdi>
              {[row.original.user?.firstName, row.original.user?.lastName]
                .filter(Boolean)
                .join(" ")}
            </bdi>
          </span>
        </div>
      ),
    },
    {
      accessorKey: "emailAddress",
      header: tEmployees("email"),
      cell: ({ row }) => (
        <a
          href={`mailto:${row.original.user?.email || ""}`}
          className=" text-info hover:underline"
        >
          <bdi>{row.original.user?.email || ""}</bdi>
        </a>
      ),
    },
    {
      accessorKey: "jobTitle",
      header: tEmployees("jobTitle"),
      cell: ({ row }) => (
        <span className=" font-medium ">
          {row.original.jobTitle ? <bdi>{row.original.jobTitle}</bdi> : "--"}
        </span>
      ),
    },
    {
      accessorKey: "jobType",
      header: tEmployees("jobType"),
      cell: ({ row }) => (
        <span className=" font-medium ">
          {employmentType(row.original.employeeType)}
        </span>
      ),
    },
    {
      id: "actions",
      header: tEmployees("action"),
      cell: ({ row }) => {
        const [assignManager, { isLoading: isAssigningManager }] =
          useAssignManagerMutation();
        const [removeEmployee, { isLoading: isRemovingEmployee }] =
          useRemoveEmployeeMutation();

        const handleAssignManager = async () => {
          await reqWithToaster(t("management.notifications.assigningManager"), async () => {
            await assignManager({
              departmentId,
              managerUserId: row.original.id.toString(),
            }).unwrap();
          });
        };

        const isManager = row.original.id.toString() === managerUserId;
        return (
          <div className="flex items-center gap-2">
            <IconButton
              label={isManager ? tActions("isManager") : tActions("makeManager")}
              variant={isManager ? "default" : "outline"}
              onClick={handleAssignManager}
              disabled={isAssigningManager || isManager}
            >
              {isManager ? <UserCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </IconButton>

            <IconButton
              label={tActions("viewDetails")}
              variant="outline-view"
              href={`/employees/${row.original.id}`}
            >
              <Eye className="h-4 w-4" />
            </IconButton>

            <DeleteDialog
              isDestructive={false}
              title={tDelete("member.title", { name: `${row.original.user?.firstName ?? ""} ${row.original.user?.lastName ?? ""}`.trim() })}
              description={tDelete("member.impact")}
              confirmText={tDelete("member.confirm")}
              loading={isRemovingEmployee}
              onConfirm={() =>
                removeEmployee({
                  departmentId,
                  employeeId: row.original.id.toString(),
                }).unwrap()
              }
              trigger={
                <IconButton
                  label={isManager ? tActions("managerCantBeRemoved") : tActions("removeEmployee")}
                  variant="outline-delete"
                  disabled={isManager || isRemovingEmployee}
                >
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
