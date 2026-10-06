"use client";

import { Icon } from "@iconify/react";
import TicketNoteAttachmentItem from "@/components/pages/tickets/TicketContactNotes/TicketNotesList/TicketNoteBubble/TicketNoteAttachmentItem";
import { cn } from "@/lib/utils";
import { formatSlashDateTime } from "@/lib/format-date";
import { buildTicketNoteAttachment } from "@/lib/tickets";
import type { TicketNote } from "@/types/tickets";

type Props = {
  note: TicketNote;
};

export default function TicketNoteBubble({ note }: Props) {
  const isOwn = note.isMe;
  const authorLabel = isOwn ? "You" : note.authorName;
  const attachment = note.fileUrl
    ? buildTicketNoteAttachment(note.fileUrl)
    : null;

  return (
    <div className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[90%] rounded-xl border px-4 py-3",
          isOwn
            ? "border-primary/20 bg-primary/5"
            : "border-transparent bg-muted",
        )}
      >
        <p
          className={cn(
            "text-sm font-semibold",
            isOwn ? "text-primary" : "text-foreground",
          )}
        >
          {authorLabel}
        </p>

        {note.note ? (
          <p className="mt-1 text-sm leading-relaxed text-secondary">
            {note.note}
          </p>
        ) : null}

        {attachment ? (
          <div className="mt-2">
            <TicketNoteAttachmentItem
              attachment={attachment}
              accent={isOwn ? "team" : "customer"}
            />
          </div>
        ) : null}

        <div className="mt-2 flex items-center gap-1.5 text-secondary">
          <Icon
            icon="solar:clock-circle-linear"
            className="size-3.5 shrink-0"
          />
          <span className="text-xs">{formatSlashDateTime(note.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
