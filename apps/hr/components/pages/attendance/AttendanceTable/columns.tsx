// "use client";
// import { ColumnDef } from "@tanstack/react-table";
// import {
//   IAttendanceSession,
//   IAttendanceLeave,
//   IAttendanceAbsenceItem,
//   IAttendanceDayOff,
// } from "@/types/attendance";
// import { cn } from "@/lib/utils";
// import StatusBadge from "@/components/shared/StatusBadge";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// export const useSessionColumns = () => {
//   return [
//     {
//       accessorKey: "employee.name",
//       header: "Employee Name",
//       cell: ({ row }) => {
//         const { employee } = row.original;

//         // 1. Safety check: If employee is missing, return a fallback UI
//         if (!employee) {
//           return (
//             <span className="text-fg-subtle italic text-sm">
//               Unknown Employee
//             </span>
//           );
//         }

//         const initials =
//           employee.name
//             ?.split(" ")
//             .map((n: string) => n[0])
//             .join("")
//             .toUpperCase() || "??";

//         return (
//           <div className="flex items-center gap-3">
//             <Avatar className="h-9 w-9 border">
//               <AvatarImage src={employee.avatar} alt={employee.name} />
//               <AvatarFallback>{initials}</AvatarFallback>
//             </Avatar>
//             <div className="flex flex-col">
//               <span className="font-semibold text-sm text-fg leading-none">
//                 {employee.name}
//               </span>
//             </div>
//           </div>
//         );
//       },
//     },
//     {
//       accessorKey: "employee.jobTitle",
//       header: "Job Title",
//       cell: ({ row }) => (
//         <span>{row.original.employee?.jobTitle || "No Title"}</span>
//       ),
//     },
//     {
//       accessorKey: "employee.jobTitle",
//       header: "Job Title",
//       cell: ({ row }) => <span>{row.original.employee.jobTitle ?? "N/A"}</span>,
//     },
//     {
//       accessorKey: "employee.department",
//       header: "Department",
//       cell: ({ row }) => (
//         <span>{row.original.employee.department?.name ?? "No Department"}</span>
//       ),
//     },
//     {
//       accessorKey: "startWork",
//       header: "Start Work",
//       cell: ({ row }) => (
//         <span className="tabular-nums">{row.original.startWork}</span>
//       ),
//     },
//     {
//       accessorKey: "endWork",
//       header: "End Work",
//       cell: ({ row }) => (
//         <span className="tabular-nums">{row.original.endWork}</span>
//       ),
//     },
//     {
//       accessorKey: "status",
//       header: "Status",
//       cell: ({ row }) => {
//         return <StatusBadge status={row.original.status} />;
//       },
//     },
//     {
//       accessorKey: "logHours",
//       header: "Log Hours",
//       cell: ({ row }) => <span>{row.original.logHours}</span>,
//     },
//     {
//       accessorKey: "overtime",
//       header: "Overtime",
//       cell: ({ row }) => (
//         <span>
//           {row.original.overtime > 0 ? `${row.original.overtime} min` : "-"}
//         </span>
//       ),
//     },
//     {
//       accessorKey: "late",
//       header: "Late",
//       cell: ({ row }) => (
//         <span>{row.original.late > 0 ? `${row.original.late} min` : "-"}</span>
//       ),
//     },
//   ] as ColumnDef<IAttendanceSession>[];
// };

// export const useLeaveColumns = () => {
//   return [
//     {
//       accessorKey: "employee.name",
//       header: "Employee",
//       cell: ({ row }) => {
//         const { name, avatar } = row.original.employee;
//         const initials = name
//           .split(" ")
//           .map((n) => n[0])
//           .join("")
//           .toUpperCase();

//         return (
//           <div className="flex items-center gap-3">
//             <Avatar className="h-8 w-8 border">
//               <AvatarImage src={avatar} alt={name} />
//               <AvatarFallback className="text-[10px]">
//                 {initials}
//               </AvatarFallback>
//             </Avatar>
//             <span className="font-semibold text-sm text-fg leading-none mb-1">
//               {name}
//             </span>
//           </div>
//         );
//       },
//     },
//     {
//       accessorKey: "employee.jobTitle",
//       header: "Job Title",
//       cell: ({ row }) => (
//         <span className="text-sm text-fg-muted">
//           {row.original.employee?.jobTitle || "No Title"}
//         </span>
//       ),
//     },
//     {
//       accessorKey: "employee.department",
//       header: "Department",
//       cell: ({ row }) => (
//         <span>
//           {row.original.employee?.department?.name || "No Department"}
//         </span>
//       ),
//     },
//     {
//       accessorKey: "leaveDate",
//       header: "Leave Date",
//       cell: ({ row }) => <span>{row.original.leaveDate}</span>,
//     },
//     {
//       accessorKey: "leaveType",
//       header: "Type",
//       cell: ({ row }) => <span>{row.original.leaveType}</span>,
//     },
//     {
//       accessorKey: "status",
//       header: "Status",
//       cell: ({ row }) => {
//         const status = row.original.status.toLowerCase();
//         return <StatusBadge status={status} />;
//       },
//     },
//     {
//       accessorKey: "logHoursSeconds",
//       header: "Log Hours",
//       cell: ({ row }) => {
//         const hours = Math.floor(row.original.logHoursSeconds / 3600);
//         const minutes = Math.floor((row.original.logHoursSeconds % 3600) / 60);
//         return (
//           <span>
//             {hours}h {minutes}m
//           </span>
//         );
//       },
//     },
//     {
//       accessorKey: "note",
//       header: "Note",
//       cell: ({ row }) => (
//         <span title={row.original.note}>
//           {row.original.note || "No note provided"}
//         </span>
//       ),
//     },
//   ] as ColumnDef<IAttendanceLeave>[];
// };

// export const useAbsenceColumns = () => {
//   return [
//     {
//       accessorKey: "employee.name",
//       header: "Employee Name",
//       cell: ({ row }) => {
//         const employee = row.original.employee;
//         if (!employee) return <span className="text-fg-subtle">N/A</span>;

//         const initials = employee.name
//           .split(" ")
//           .map((n) => n[0])
//           .join("")
//           .toUpperCase();
//         return (
//           <div className="flex items-center gap-3">
//             <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
//               <AvatarImage src={employee.avatar} alt={employee.name} />
//               <AvatarFallback className="text-xs bg-muted">
//                 {initials}
//               </AvatarFallback>
//             </Avatar>
//             <span className="font-semibold text-sm text-fg leading-none mb-1">
//               {employee.name}
//             </span>
//           </div>
//         );
//       },
//     },
//     {
//       accessorKey: "employee.jobTitle",
//       header: "Job Title",
//       cell: ({ row }) => (
//         <span className="text-sm text-fg-muted">
//           {row.original.employee?.jobTitle || "No Title"}
//         </span>
//       ),
//     },
//     {
//       accessorKey: "employee.department",
//       header: "Department",
//       cell: ({ row }) => (
//         <span>
//           {row.original.employee?.department?.name || "No Department"}
//         </span>
//       ),
//     },
//     {
//       accessorKey: "dateTo",
//       header: "Date",
//       cell: ({ row }) => (
//         <span className="text-sm font-medium text-fg-muted">
//           {row.original.date}
//         </span>
//       ),
//     },
//     {
//       accessorKey: "duration",
//       header: "Duration",
//       cell: ({ row }) => (
//         <span className="text-sm text-fg-muted">
//           {row.original.isHalfDay ? "0.5 day" : "1 day"}
//         </span>
//       ),
//     },
//   ] as ColumnDef<IAttendanceAbsenceItem>[];
// };

// export const useDayOffColumns = () => {
//   return [
//     {
//       accessorKey: "employee.name",
//       header: "Employee Name",
//       cell: ({ row }) => {
//         const { employee } = row.original;
//         const initials =
//           employee.name
//             ?.split(" ")
//             .map((n) => n[0])
//             .join("")
//             .toUpperCase() || "??";

//         return (
//           <div className="flex items-center gap-3">
//             <Avatar className="h-9 w-9 border">
//               <AvatarImage src={employee.avatar} alt={employee.name} />
//               <AvatarFallback>{initials}</AvatarFallback>
//             </Avatar>
//             <div className="flex flex-col">
//               <span className="font-semibold text-sm text-fg leading-none">
//                 {employee.name}
//               </span>
//             </div>
//           </div>
//         );
//       },
//     },
//     {
//       accessorKey: "employee.jobTitle",
//       header: "Job Title",
//       cell: ({ row }) => (
//         <span>{row.original.employee?.jobTitle || "No Title"}</span>
//       ),
//     },
//     {
//       accessorKey: "employee.department",
//       header: "Department",
//       cell: ({ row }) => (
//         <span>{row.original.employee.department?.name || "No Department"}</span>
//       ),
//     },
//     {
//       accessorKey: "date",
//       header: "Date From",
//       cell: ({ row }) => <span>{row.original.date}</span>,
//     },
//     {
//       id: "duration",
//       header: "Duration",
//       cell: () => <span>1 Day</span>,
//     },
//     {
//       accessorKey: "type",
//       header: "Type",
//       cell: ({ row }) => {
//         const type = row.original.type;
//         return (
//           <span
//             className={cn(
//               "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
//               type === "public_holiday"
//                 ? "bg-info-subtle text-info border-info/30"
//                 : type === "weekend"
//                   ? "bg-sunken text-fg-muted border-line"
//                   : type === "approved_leave"
//                     ? "bg-success-subtle text-success border-success/30"
//                     : "bg-brand-subtle text-fg-brand border-fg-brand/30",
//             )}
//           >
//             {row.original.typeLabel}
//           </span>
//         );
//       },
//     },
//   ] as ColumnDef<IAttendanceDayOff>[];
// };

"use client";
import { ColumnDef } from "@tanstack/react-table";
import {
  IAttendanceSession,
  IAttendanceLeave,
  IAttendanceAbsenceItem,
  IAttendanceDayOff,
} from "@/types/attendance";
import { cn } from "@/lib/utils";
import StatusBadge from "@/components/shared/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslations } from "next-intl";

// Helper to get initials safely
const getInitials = (name?: string) => {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export const useSessionColumns = () => {
  const t = useTranslations("attendanceTable");
  return [
    {
      accessorKey: "employee.name",
      header: t("columns.employeeName"),
      cell: ({ row }) => {
        const emp = row.original.employee;
        if (!emp) return null;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-line">
              <AvatarImage
                src={emp.avatar}
                alt={emp.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-sunken text-[10px] font-bold text-fg-subtle">
                {getInitials(emp.name)}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm text-fg">
              <bdi>{emp.name}</bdi>
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "employee.jobTitle",
      header: t("columns.jobTitle"),
      cell: ({ row }) => (
        <span>
          {row.original.employee?.jobTitle ? (
            <bdi>{row.original.employee.jobTitle}</bdi>
          ) : (
            t("fallback.na")
          )}
        </span>
      ),
    },
    {
      accessorKey: "employee.department",
      header: t("columns.department"),
      cell: ({ row }) => (
        <span>
          {row.original.employee?.department?.name ? (
            <bdi>{row.original.employee.department.name}</bdi>
          ) : (
            t("fallback.noDepartment")
          )}
        </span>
      ),
    },
    { accessorKey: "startWork", header: t("columns.startWork") },
    {
      accessorKey: "endWork",
      header: t("columns.endWork"),
      // A session still open comes back as "In progress" instead of a time.
      cell: ({ row }) =>
        row.original.endWork === "In progress"
          ? t("inProgress")
          : row.original.endWork,
    },
    {
      accessorKey: "status",
      header: t("columns.status"),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    { accessorKey: "logHours", header: t("columns.logHours") },
    {
      accessorKey: "overtime",
      header: t("columns.overtime"),
      cell: ({ row }) =>
        row.original.overtime > 0
          ? t("duration.minutes", { count: row.original.overtime })
          : "-",
    },
    {
      accessorKey: "late",
      header: t("columns.late"),
      cell: ({ row }) =>
        row.original.late > 0
          ? t("duration.minutes", { count: row.original.late })
          : "-",
    },
  ] as ColumnDef<IAttendanceSession>[];
};

export const useLeaveColumns = () => {
  const t = useTranslations("attendanceTable");
  const tTypes = useTranslations("leaveTypes");
  return [
    {
      accessorKey: "employee.name",
      header: t("columns.employee"),
      cell: ({ row }) => {
        const emp = row.original.employee;
        if (!emp) return null;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border">
              <AvatarImage src={emp.avatar} alt={emp.name} />
              <AvatarFallback className="text-[10px]">
                {getInitials(emp.name)}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm text-fg">
              <bdi>{emp.name}</bdi>
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "employee.jobTitle",
      header: t("columns.jobTitle"),
      cell: ({ row }) => (
        <span>
          {row.original.employee?.jobTitle ? (
            <bdi>{row.original.employee.jobTitle}</bdi>
          ) : (
            t("fallback.noTitle")
          )}
        </span>
      ),
    },
    {
      accessorKey: "employee.department",
      header: t("columns.department"),
      cell: ({ row }) => (
        <span>
          {row.original.employee?.department?.name ? (
            <bdi>{row.original.employee.department.name}</bdi>
          ) : (
            t("fallback.noDepartment")
          )}
        </span>
      ),
    },
    { accessorKey: "leaveDate", header: t("columns.leaveDate") },
    {
      accessorKey: "leaveType",
      header: t("columns.type"),
      cell: ({ row }) =>
        row.original.leaveType && tTypes.has(row.original.leaveType)
          ? tTypes(row.original.leaveType)
          : row.original.leaveType,
    },
    {
      accessorKey: "status",
      header: t("columns.status"),
      cell: ({ row }) => (
        <StatusBadge status={row.original.status.toLowerCase()} />
      ),
    },
    {
      accessorKey: "logHoursSeconds",
      header: t("columns.logHours"),
      cell: ({ row }) => {
        const hours = Math.floor(row.original.logHoursSeconds / 3600);
        const minutes = Math.floor((row.original.logHoursSeconds % 3600) / 60);
        return (
          <span>
            {t("duration.hoursMinutes", { hours, minutes })}
          </span>
        );
      },
    },
    {
      accessorKey: "note",
      header: t("columns.note"),
      cell: ({ row }) =>
        row.original.note ? <span dir="auto">{row.original.note}</span> : null,
    },
  ] as ColumnDef<IAttendanceLeave>[];
};

export const useAbsenceColumns = () => {
  const t = useTranslations("attendanceTable");
  return [
    {
      accessorKey: "employee.name",
      header: t("columns.employeeName"),
      cell: ({ row }) => {
        const emp = row.original.employee;
        if (!emp) return <span className="text-fg-subtle">{t("fallback.na")}</span>;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
              <AvatarImage src={emp.avatar} alt={emp.name} />
              <AvatarFallback className="text-xs bg-muted">
                {getInitials(emp.name)}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm text-fg">
              <bdi>{emp.name}</bdi>
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "employee.jobTitle",
      header: t("columns.jobTitle"),
      cell: ({ row }) => (
        <span>
          {row.original.employee?.jobTitle ? (
            <bdi>{row.original.employee.jobTitle}</bdi>
          ) : (
            t("fallback.noTitle")
          )}
        </span>
      ),
    },
    {
      accessorKey: "employee.department",
      header: t("columns.department"),
      cell: ({ row }) => (
        <span>
          {row.original.employee?.department?.name ? (
            <bdi>{row.original.employee.department.name}</bdi>
          ) : (
            t("fallback.noDepartment")
          )}
        </span>
      ),
    },
    { accessorKey: "date", header: t("columns.date") },
    {
      accessorKey: "duration",
      header: t("columns.duration"),
      cell: ({ row }) =>
        row.original.isHalfDay ? t("duration.halfDay") : t("duration.oneDay"),
    },
  ] as ColumnDef<IAttendanceAbsenceItem>[];
};

export const useDayOffColumns = () => {
  const t = useTranslations("attendanceTable");
  const tDayOff = useTranslations("attendanceTable.dayOffTypes");
  return [
    {
      accessorKey: "employee.name",
      header: t("columns.employeeName"),
      cell: ({ row }) => {
        const emp = row.original.employee;
        if (!emp) return <span className="text-fg-subtle italic">{t("fallback.unknown")}</span>;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border">
              <AvatarImage src={emp.avatar} alt={emp.name} />
              <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm text-fg">
              <bdi>{emp.name}</bdi>
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "employee.jobTitle",
      header: t("columns.jobTitle"),
      cell: ({ row }) => (
        <span>
          {row.original.employee?.jobTitle ? (
            <bdi>{row.original.employee.jobTitle}</bdi>
          ) : (
            t("fallback.noTitle")
          )}
        </span>
      ),
    },
    {
      accessorKey: "employee.department",
      header: t("columns.department"),
      cell: ({ row }) => (
        <span>
          {row.original.employee?.department?.name ? (
            <bdi>{row.original.employee.department.name}</bdi>
          ) : (
            t("fallback.noDepartment")
          )}
        </span>
      ),
    },
    { accessorKey: "date", header: t("columns.dateFrom") },
    { id: "duration", header: t("columns.duration"), cell: () => t("duration.oneDay") },
    {
      accessorKey: "type",
      header: t("columns.type"),
      cell: ({ row }) => {
        const type = row.original.type;
        return (
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
              type === "public_holiday"
                ? "bg-info-subtle text-info border-info/30"
                : type === "weekend"
                  ? "bg-sunken text-fg-muted border-line"
                  : type === "approved_leave"
                    ? "bg-success-subtle text-success border-success/30"
                    : "bg-brand-subtle text-fg-brand border-fg-brand/30",
            )}
          >
            {type && tDayOff.has(type) ? tDayOff(type) : row.original.typeLabel}
          </span>
        );
      },
    },
  ] as ColumnDef<IAttendanceDayOff>[];
};
