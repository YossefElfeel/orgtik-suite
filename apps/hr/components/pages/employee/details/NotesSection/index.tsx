"use client";
import { CircleNotch as Loader2, Note as StickyNote } from "@phosphor-icons/react";

import { useState } from "react";
import { SectionCard } from "../SectionCard";
import { InfoCardSkeleton } from "@/components/shared/EmployeeFacts";
import { Skeleton } from "@orgtik/ui";
import { NoteForm } from "./NoteForm";
import { NoteItem } from "./NoteItem";
import {
  useGetEmployeeNotesQuery,
  useCreateEmployeeNoteMutation,
  useUpdateEmployeeNoteMutation,
  useDeleteEmployeeNoteMutation,
} from "@/redux/features/employee/employeeApi";
import type { NoteFormValues } from "@/schemas/notes/notes.schema";
import { useReqWithToaster } from "@/hooks/useReqWithToaster";
import { useTranslations } from "next-intl";

interface NotesSectionProps {
  employeeId: string | number;
  isLoading?: boolean;
}

export function NotesSection({
  employeeId,
  isLoading: isEmployeeLoading,
}: NotesSectionProps) {
  const t = useTranslations("employees.details.notes");
  const reqWithToaster = useReqWithToaster();

  const {
    data: notesRes,
    isLoading: isNotesLoading,
    isFetching,
  } = useGetEmployeeNotesQuery({
    id: employeeId,
  });

  const [createNote, { isLoading: isCreating }] =
    useCreateEmployeeNoteMutation();
  const [updateNote] = useUpdateEmployeeNoteMutation();
  const [deleteNote] = useDeleteEmployeeNoteMutation();

  const handleCreateNote = async (values: NoteFormValues) => {
    await reqWithToaster(t("toasts.adding"), async () => {
      await createNote({ id: employeeId, body: values }).unwrap();
    });
  };

  const handleUpdateNote = async (noteId: string | number, content: string) => {
    await reqWithToaster(t("toasts.updating"), async () => {
      await updateNote({ id: employeeId, noteId, body: { content } }).unwrap();
    });
  };

  // The confirm waits for this and stays open if it fails (the base query says why).
  const handleDeleteNote = async (noteId: string | number) => {
    await deleteNote({ id: employeeId, noteId }).unwrap();
  };

  const notes = notesRes?.data || [];

  if (isEmployeeLoading || (isNotesLoading && !notesRes)) {
    return (
      <InfoCardSkeleton itemCount={0}>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>
      </InfoCardSkeleton>
    );
  }

  return (
    <SectionCard title={t("title")} icon={StickyNote}>
      <div className="space-y-6">
        <NoteForm onSubmit={handleCreateNote} isSubmitting={isCreating} />

        <div className="relative space-y-2">
          {isFetching && !isNotesLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/50 backdrop-blur-[1px]">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          )}

          {notes.length > 0 ? (
            <div className="divide-y divide-border/50">
              {notes.map((note) => (
                <div key={note.id} className="py-2 first:pt-0 last:pb-0">
                  <NoteItem
                    note={note}
                    onUpdate={(content) => handleUpdateNote(note.id, content)}
                    onDelete={() => handleDeleteNote(note.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <StickyNote className="mb-2 size-8 text-fg-subtle" />
              <p className="text-sm text-secondary">
                {t("empty")}
              </p>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
