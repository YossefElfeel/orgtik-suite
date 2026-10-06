
import type { ColumnDef } from "@tanstack/react-table";
import type { useTranslations } from "next-intl";
import type { IEmployeeAttendanceItem, IEmployeeLeaveItem } from "@/types/employee";
import { StatusPill } from "../StatusPill";
import { format, parseISO } from "date-fns";

/**
 * `t` is "employees.details.timeOff"; `tTable` is "attendanceTable" (shared duration wording);
 * `tTypes` is "leaveTypes".
 */
export const getAttendanceColumns = (
  t: ReturnType<typeof useTranslations>,
  tTable: ReturnType<typeof useTranslations>,
): ColumnDef<IEmployeeAttendanceItem>[] => [
  {
    accessorKey: "dateFrom",
    header: t("columns.dateFrom"),
    cell: ({ row }) => {
      try {
        const date = parseISO(row.original.dateFrom);
        return <span className="font-medium text-foreground">{format(date, "dd/MM/yyyy")}</span>;
      } catch (e) {
        return <span className="font-medium text-foreground">{row.original.dateFrom}</span>;
      }
    },
  },
  {
    accessorKey: "startWork",
    header: t("columns.startWork"),
    cell: ({ row }) => row.original.startWork || "-",
  },
  {
    accessorKey: "endWork",
    header: t("columns.endWork"),
    // A day still open comes back as "In progress" instead of a time.
    cell: ({ row }) =>
      row.original.endWork === "In progress"
        ? tTable("inProgress")
        : row.original.endWork || "-",
  },
  {
    accessorKey: "status",
    header: t("columns.status"),
    cell: ({ row }) => <StatusPill status={row.original.status} />,
  },
  {
    accessorKey: "logHours",
    header: t("columns.logHours"),
    cell: ({ row }) => row.original.logHours || "-",
  },
  {
    accessorKey: "overtime",
    header: t("columns.overtime"),
    cell: ({ row }) =>
      row.original.overtime ? tTable("duration.minutes", { count: row.original.overtime }) : "-",
  },
];

// The API writes a leave's length in English ("2 days", "4.5 hours"): read the number and unit.
const DURATION = /^(\d+(?:\.\d+)?)\s+(days?|hours?)$/i;

/** `tDuration` is "timeOffTable.duration" (daysCount, hoursCount). */
export const leaveColumns = (
  t: ReturnType<typeof useTranslations>,
  tTypes: ReturnType<typeof useTranslations>,
  tDuration: ReturnType<typeof useTranslations>,
): ColumnDef<IEmployeeLeaveItem>[] => [
  {
    id: "select",
    header: "",
    cell: () => (
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
        aria-label={t("selectLeaveEntry")}
      />
    ),
  },
  {
    accessorKey: "leaveType",
    header: t("columns.leaveType"),
    cell: ({ row }) => {
      const type = row.original.leaveType;
      return tTypes.has(type) ? (
        <span>{tTypes(type)}</span>
      ) : (
        <span className="capitalize">{type.replace(/_/g, " ")}</span>
      );
    },
  },
  {
    accessorKey: "dateFrom",
    header: t("columns.dateFrom"),
    cell: ({ row }) => {
      try {
        const date = parseISO(row.original.dateFrom);
        return format(date, "dd/MM/yyyy");
      } catch (e) {
        return row.original.dateFrom;
      }
    },
  },
  {
    accessorKey: "duration",
    header: t("columns.duration"),
    cell: ({ row }) => {
      const m = DURATION.exec(row.original.duration?.trim() ?? "");
      if (!m) return row.original.duration;
      const count = Number(m[1]);
      return m[2].toLowerCase().startsWith("day")
        ? tDuration("daysCount", { count })
        : tDuration("hoursCount", { count });
    },
  },
  {
    accessorKey: "dateTo",
    header: t("columns.dateTo"),
    cell: ({ row }) => {
      try {
        const date = parseISO(row.original.dateTo);
        return format(date, "dd/MM/yyyy");
      } catch (e) {
        return row.original.dateTo;
      }
    },
  },
  {
    accessorKey: "status",
    header: t("columns.status"),
    cell: ({ row }) => <StatusPill status={row.original.status} />,
  },
  {
    accessorKey: "note",
    header: t("columns.note"),
    cell: ({ row }) => (
      <span dir="auto" className="text-ellipsis line-clamp-2" title={row.original.note}>
        {row.original.note || "-"}
      </span>
    ),
  },
];
