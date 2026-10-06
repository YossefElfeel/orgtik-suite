import { Clock } from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import FileCard from "./FileCard";
import { SafeHtml } from "@/components/shared/SafeHtml";
import { ITicketMessage } from "@/types/ticket";
import { useFormatter, useTranslations } from "next-intl";

const getInitials = (fullName: string) =>
  fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

function TicketCard({ message }: { message: ITicketMessage }) {
  const t = useTranslations("ticketThread");
  const format = useFormatter();
  const sentAt = message?.createdAt ? new Date(message.createdAt) : null;
  const sentAtLabel =
    sentAt && !Number.isNaN(sentAt.getTime())
      ? format.dateTime(sentAt, { dateStyle: "short", timeStyle: "short" })
      : "-";
  const senderName =
    `${message.sender?.firstName ?? ""} ${message.sender?.lastName ?? ""}`.trim() ||
    message.sender?.username ||
    t("unknownUser");

  return (
    <div className="border rounded-lg bg-raised p-5 flex flex-col gap-5">
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Avatar size="lg">
            <AvatarImage src={message?.sender?.avatar} alt={senderName} />
            <AvatarFallback>{getInitials(senderName) || "NA"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col h-full ">
            <h5 className="text-body-lg font-medium ">
              {senderName === t("unknownUser") ? senderName : <bdi>{senderName}</bdi>}
            </h5>
            <p className="text-caption text-secondary">
              {message?.sender?.email ? <bdi>{message.sender.email}</bdi> : t("ticketUser")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-body text-secondary">
          <Clock className="size-4" />
          <p>{sentAtLabel}</p>
        </div>
      </div>

      <div className="h-px w-full bg-border"></div>
      <SafeHtml className="text-body-lg prose prose-sm max-w-none" html={message?.content} />

      {/* files */}
      {message?.attachments?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {message?.attachments?.map((attachment) => (
            <FileCard key={attachment.id} attachment={attachment} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default TicketCard;
