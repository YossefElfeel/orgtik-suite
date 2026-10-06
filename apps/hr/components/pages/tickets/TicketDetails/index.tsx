"use client";

import type { ReactNode } from "react";
import CardLayout from "./CardLayout";
import StatusBadge from "@/components/shared/StatusBadge";
import { ITicket, ITicketDetail } from "@/types/ticket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/utils/formateDate";
import { useTranslations } from "next-intl";

type DetailItem = {
  label: string;
  value?: ReactNode;
  content?: ReactNode;
};

const getInitials = (name?: string) => {
  if (!name) return "NA";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

function TicketDetails({ ticket }: { ticket?: ITicketDetail }) {
  const t = useTranslations("ticketDetails");
  const details: DetailItem[] = [
    {
      label: t("labels.ticketId"),
      value: ticket?.id?.toString() || "-",
    },
    {
      label: t("labels.ticketCreator"),
      content: (
        <div className="flex items-center gap-2">
          <Avatar size="default">
            <AvatarImage
              src={ticket?.createdBy?.avatar}
              alt={
                ticket?.createdBy?.firstName + " " + ticket?.createdBy?.lastName
              }
            />
            <AvatarFallback>
              {getInitials(
                ticket?.createdBy?.firstName +
                  " " +
                  ticket?.createdBy?.lastName,
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex h-full flex-col">
            <h5 className="text-body-lg font-medium">
              <bdi>
                {ticket?.createdBy?.firstName +
                  " " +
                  ticket?.createdBy?.lastName || "-"}
              </bdi>
            </h5>
            <p className="text-caption text-secondary">{t("labels.ticketCreator")}</p>
          </div>
        </div>
      ),
    },
    {
      label: t("labels.email"),
      value: ticket?.createdBy?.email ? <bdi>{ticket.createdBy.email}</bdi> : "-",
    },
    {
      label: t("labels.subject"),
      value: ticket?.subject ? <bdi>{ticket.subject}</bdi> : "-",
    },
    {
      label: t("labels.status"),
      content: ticket?.status ? (
        <StatusBadge status={ticket.status} size="sm" />
      ) : (
        "-"
      ),
    },
    {
      label: t("labels.createdAt"),
      value: ticket?.createdAt ? formatDate(ticket.createdAt) : "-",
    },
  ];

  return (
    <CardLayout title={t("title")}>
      <dl className="flex flex-col gap-5">
        {details.map((item) => (
          <div
            key={item.label}
            className="grid grid-cols-1 gap-1 
            
            sm:grid-cols-[minmax(140px,42%)_1fr] sm:items-center sm:gap-6"
          >
            <dt className="text-body text-secondary">{item.label}</dt>
            <dd className="min-w-0 wrap-break-word text-body font-medium ">
              {item.content ?? item.value}
            </dd>
          </div>
        ))}
      </dl>
    </CardLayout>
  );
}

export default TicketDetails;
