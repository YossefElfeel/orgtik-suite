"use client";
import { CalendarBlank as Calendar, DotsThreeVertical as MoreVertical, PencilSimple as Pencil, Trash as Trash2 } from "@phosphor-icons/react";

import { useTranslations } from "next-intl";
import { IconButton } from "@/components/shared/IconButton";
import { INote } from "@/types/notes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { NoteForm } from "./NoteForm";
import type { NoteFormValues } from "@/schemas/notes/notes.schema";
import { ConfirmDialog } from "@orgtik/ui";

interface NoteItemProps {
  note: INote;
  onUpdate: (content: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function NoteItem({ note, onUpdate, onDelete }: NoteItemProps) {
  const tDelete = useTranslations("deleteDialog");
  const tActions = useTranslations("actions");
  const t = useTranslations("employees.details.notes");
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleUpdate = async (values: NoteFormValues) => {
    setIsUpdating(true);
    try {
      await onUpdate(values.content);
      setIsEditing(false);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="group relative space-y-2 rounded-xl border border-transparent p-3 transition-all hover:border-border hover:bg-gray/30">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8">
            <AvatarImage
              src={note.createdByUser.avatar}
              alt={`${note.createdByUser.firstName} ${note.createdByUser.lastName}`}
            />
            <AvatarFallback className="text-xs">
              {note.createdByUser.firstName?.[0]}
              {note.createdByUser.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                <bdi>
                  {note.createdByUser.firstName} {note.createdByUser.lastName}
                </bdi>
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-secondary">
              <Calendar className="size-3.5" aria-hidden />
              <span>{format(new Date(note.createdAt), "dd/MM/yyyy")}</span>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <IconButton
                label={tActions("moreActions")}
                variant="ghost"
                tooltip={false}
                className="size-8 rounded-lg text-secondary opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 focus-visible:opacity-100 data-[popup-open]:opacity-100"
              />
            }
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32 rounded-xl">
            <DropdownMenuItem
              onClick={() => setIsEditing(true)}
              className="gap-2 text-sm text-foreground focus:bg-muted"
            >
              <Pencil className="size-3.5" />
              <span>{tActions("edit")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsDeleteOpen(true)}
              className="gap-2 text-sm text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <Trash2 className="size-3.5" />
              <span>{tActions("delete")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isEditing ? (
        <NoteForm
          initialValues={{ content: note.content }}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
          isSubmitting={isUpdating}
          submitLabel={t("update")}
        />
      ) : (
        <p dir="auto" className="whitespace-pre-wrap text-sm leading-6 text-secondary">
          {note.content}
        </p>
      )}

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        tone="danger"
        irreversible
        title={tDelete("noteTitle")}
        impact={tDelete("noteImpact")}
        confirmLabel={tDelete("noteConfirm")}
        cancelLabel={tDelete("cancel")}
        onConfirm={() => onDelete()}
      />
    </div>
  );
}
