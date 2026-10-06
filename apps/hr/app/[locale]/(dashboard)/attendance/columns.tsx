"use client";
import { Eye as EyeIcon, Trash as TrashIcon } from "@phosphor-icons/react";

import { ColumnDef } from "@tanstack/react-table";
import CustomAvatar from "@/components/shared/CustomAvatar";
import { Button } from "@/components/ui/button";
import StatusBadge, { TaskStatus } from "@/components/shared/StatusBadge";
import CustomizeTooltip from "@/components/shared/CustomizeTooltip";
import { useTranslations } from "next-intl";

export type ITicket = {
  id: string;
  ticketId: string;
  subject: string;
  employeeName: string;
  employeeAvatar?: string;
  createdDate: string;
  emailAddress: string;
  status: TaskStatus;
  jobTitle?: string;
  phone?: string;
  shift?: string;
};

export const useColumns = () => {
  const t = useTranslations("attendanceLegacyTable");
  const columns: ColumnDef<ITicket>[] = [
    {
      accessorKey: "ticketId",
      header: t("columns.ticketId"),

      cell: ({ row }) => (
        <span className="text-sm font-medium ">{row.original.ticketId}</span>
      ),
    },
    {
      accessorKey: "subject",
      header: t("columns.subject"),
      cell: ({ row }) => (
        <span className="text-sm font-medium text-fg line-clamp-1 max-w-[150px]">
          {row.original.subject}
        </span>
      ),
    },
    {
      accessorKey: "employeeName",
      header: t("columns.employeeName"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <CustomAvatar
            src={row.original.employeeAvatar}
            //   name={row.original.employeeName}

            className="h-8 w-8"
          />
          <span className="text-sm font-semibold text-fg-muted">
            {row.original.employeeName}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "createdDate",
      header: t("columns.createdDate"),
      cell: ({ row }) => (
        <span className="text-sm text-fg-subtle">
          {row.original.createdDate}
        </span>
      ),
    },
    {
      accessorKey: "emailAddress",
      header: t("columns.emailAddress"),
      cell: ({ row }) => (
        <span className="text-sm text-fg-subtle lowercase">
          {row.original.emailAddress}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: t("columns.status"),
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />,
    },
    {
      id: "actions",
      header: t("columns.action"),
      cell: ({ row }) => {
        const handleView = () => console.log("View ticket:", row.original.id);
        const handleDelete = () =>
          console.log("Delete ticket:", row.original.id);

        return (
          <div className="flex items-center gap-2">
            <CustomizeTooltip title={t("tooltips.viewDetails")}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleView}
                className="h-8 w-8 rounded-lg border border-line text-fg-subtle transition-colors hover:border-info/30 hover:bg-info-subtle hover:text-info
                 "
              >
                <EyeIcon  className="h-4 w-4" aria-hidden="true" />
              </Button>
            </CustomizeTooltip>

            <CustomizeTooltip title={t("tooltips.deleteTicket")}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="h-8 w-8 rounded-lg border border-line text-fg-subtle transition-colors hover:border-danger/30 hover:bg-danger-subtle hover:text-danger"
              >
                <TrashIcon  className="h-4 w-4" aria-hidden="true" />
              </Button>
            </CustomizeTooltip>
          </div>
        );
      },
    },
  ];

  return columns;
};

export const TICKETS_DATA: ITicket[] = [
  {
    id: "1",
    ticketId: "#TC-00011",
    subject: "Punching time not proper",
    employeeName: "Tahsan Khan",
    employeeAvatar: "https://i.pravatar.cc/150?u=tahsan",
    createdDate: "Jan, 02, 2023",
    emailAddress: "tahsan@gmail.com",
    status: "solved",
    jobTitle: "Software Engineer",
    phone: "(748) 647647283",
    shift: "Fulltime",
  },
  {
    id: "2",
    ticketId: "#TC-00012",
    subject: "Internet Not Working",
    employeeName: "Herry Kane",
    employeeAvatar: "https://i.pravatar.cc/150?u=herry",
    createdDate: "Mar, 01, 2023",
    emailAddress: "herrykane@gmail.com",
    status: "new_tickets",
    jobTitle: "Software Engineer",
    phone: "(748) 647647283",
    shift: "Fulltime",
  },
  {
    id: "3",
    ticketId: "#TC-00013",
    subject: "Leave Balance Wrong",
    employeeName: "Jaman Khan",
    employeeAvatar: "https://i.pravatar.cc/150?u=jaman",
    createdDate: "Jan, 01, 2024",
    emailAddress: "jamankhan@gmail.com",
    status: "open",
    jobTitle: "Software Engineer",
    phone: "(748) 647647283",
    shift: "Fulltime",
  },
  {
    id: "4",
    ticketId: "#TC-00014",
    subject: "Mouse not working",
    employeeName: "Joe Root",
    employeeAvatar: "https://i.pravatar.cc/150?u=joe",
    createdDate: "Fab, 03, 2024",
    emailAddress: "joeroot@gmail.com",
    status: "solved",
    jobTitle: "Software Engineer",
    phone: "(748) 647647283",
    shift: "Fulltime",
  },
  {
    id: "5",
    ticketId: "#TC-00015",
    subject: "Display Blur",
    employeeName: "Janson Roy",
    employeeAvatar: "https://i.pravatar.cc/150?u=janson",
    createdDate: "Sep, 02, 2023",
    emailAddress: "jansonroy@gmail.com",
    status: "solved",
    jobTitle: "Software Engineer",
    phone: "(748) 647647283",
    shift: "Fulltime",
  },
  {
    id: "6",
    ticketId: "#TC-00016",
    subject: "Punching time not proper",
    employeeName: "James Henry",
    employeeAvatar: "https://i.pravatar.cc/150?u=james",
    createdDate: "Aug, 02, 2024",
    emailAddress: "jameshenry@gmail.com",
    status: "new_tickets",
    jobTitle: "Software Engineer",
    phone: "(748) 647647283",
    shift: "Fulltime",
  },
  {
    id: "7",
    ticketId: "#TC-00017",
    subject: "Salary Amount wrong",
    employeeName: "David Warner",
    employeeAvatar: "https://i.pravatar.cc/150?u=david",
    createdDate: "Jun, 02, 2023",
    emailAddress: "davidwar@gmail.com",
    status: "new_tickets",
    jobTitle: "Software Engineer",
    phone: "(748) 647647283",
    shift: "Fulltime",
  },
  {
    id: "8",
    ticketId: "#TC-00018",
    subject: "Internet Not Working",
    employeeName: "Herry Brooks",
    employeeAvatar: "https://i.pravatar.cc/150?u=brooks",
    createdDate: "May, 02, 2023",
    emailAddress: "herrybrooks@gmail.com",
    status: "open",
    jobTitle: "Software Engineer",
    phone: "(748) 647647283",
    shift: "Fulltime",
  },
  {
    id: "9",
    ticketId: "#TC-00019",
    subject: "Punching time not proper",
    employeeName: "Tim David",
    employeeAvatar: "https://i.pravatar.cc/150?u=tim",
    createdDate: "Jan, 02, 2024",
    emailAddress: "timdavid@gmail.com",
    status: "open",
    jobTitle: "Software Engineer",
    phone: "(748) 647647283",
    shift: "Fulltime",
  },
];
