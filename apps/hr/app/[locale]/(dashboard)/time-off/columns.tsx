"use client";
import { PencilSimple as Edit2 } from "@phosphor-icons/react";

import { IconButton } from "@/components/shared/IconButton";
import { ColumnDef } from "@tanstack/react-table";
import CustomAvatar from "@/components/shared/CustomAvatar";
import StatusBadge from "@/components/shared/StatusBadge";
import { TimeOffActionDialog } from "@/components/pages/time-off/TimeOffDialog";
import { TimeOffRequest } from "@/types/time-off";
import { useTranslations } from "next-intl";

export const useColumns = () => {
  const t = useTranslations("timeOffTable");
  const tTypes = useTranslations("leaveTypes");
  const civilDay = (value: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z'));

  const columns: ColumnDef<TimeOffRequest>[] = [
    {
      accessorKey: "employeeDiscordUsername",
      header: t("columns.employee"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <CustomAvatar
            src={row.original.employee?.avatar}
            className="h-8 w-8"
            alt={row.original.employee?.fullName}
          />
          <span><bdi>{row.original.employee?.fullName}</bdi></span>
        </div>
      ),
    },
    {
      accessorKey: "employeeDepartment",
      header: t("columns.department"),
      cell: ({ row }) => (
        <span>
          {" "}
          {row.original.employee?.departmentName ? (
            <bdi>{row.original.employee.departmentName}</bdi>
          ) : (
            t("fallback.na")
          )}
        </span>
      ),
    },
    {
      accessorKey: "timeOffType",
      header: t("columns.type"),
      cell: ({ row }) => (
        <span className={row.original.timeOffType && tTypes.has(row.original.timeOffType) ? undefined : "capitalize"}>
          {row.original.timeOffType
            ? tTypes.has(row.original.timeOffType)
              ? tTypes(row.original.timeOffType)
              : row.original.timeOffType
            : t("fallback.na")}
        </span>
      ),
    },
    {
      accessorKey: "startDate",
      header: t("columns.from"),
      cell: ({ row }) => civilDay(row.original.startDate),
    },
    {
      accessorKey: "endDate",
      header: t("columns.to"),
      cell: ({ row }) => civilDay(row.original.endDate),
    },
    {
      accessorKey: "totalDurationMinutes",
      header: t("columns.duration"),
      cell: ({ row }) => {
        const hours = row.original.totalDurationMinutes / 60;
        const days = Number((hours / 24).toFixed(2));
        return hours >= 24
          ? t("duration.daysCount", { count: days })
          : t("duration.hoursCount", { count: hours });
      },
    },
    {
      accessorKey: "status",
      header: t("columns.status"),
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} size="sm" />
      ),
    },
    {
      id: "actions",
      header: t("columns.action"),
      cell: ({ row }) => (
        <TimeOffActionDialog
          id={row.original.id}
          status={row.original.status}
          trigger={
            <IconButton label={t("tooltips.viewEdit")} variant="outline-view">
              <Edit2 className="size-4" />
            </IconButton>
          }
        />
      ),
    },
  ];

  return columns;
};
