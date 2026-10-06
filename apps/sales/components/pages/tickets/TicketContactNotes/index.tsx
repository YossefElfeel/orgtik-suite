"use client";
import { useTranslations } from "next-intl";

import { useCallback, useMemo } from "react";
import { SectionCard } from "@/components/shared/SectionCard";
import {
  NotesForm,
  type NotesFormPayload,
} from "@/components/shared/Notes/NotesForm";
import TicketNotesList from "@/components/pages/tickets/TicketContactNotes/TicketNotesList";
import {
  TICKET_NOTES_PAGE_SIZE,
  TICKET_NOTE_MAX_FILE_SIZE,
} from "@/lib/tickets";
import {
  useAddTicketNoteMutation,
  useGetTicketNotesInfiniteQuery,
} from "@/redux/features/tickets/ticketsApi";

type Props = {
  ticketId: string;
};

export default function TicketContactNotes({ ticketId }: Props) {
  const tCommon = useTranslations("common");
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useGetTicketNotesInfiniteQuery({
      ticketId,
      limit: TICKET_NOTES_PAGE_SIZE,
    });
  const [addTicketNote, { isLoading: isSending }] = useAddTicketNoteMutation();

  // Pages come newest first while the thread reads oldest to newest.
  const notes = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.data.items).reverse(),
    [data?.pages],
  );

  const loadOlderNotes = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  async function handleAddNote({ content, file }: NotesFormPayload) {
    await addTicketNote({ ticketId, note: content, file }).unwrap();
  }

  return (
    <SectionCard
      title={tCommon("contactNotes")}
      className="flex h-full max-h-[70dvh] min-h-0 flex-col overflow-hidden lg:max-h-none"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <TicketNotesList
          notes={notes}
          isLoading={isLoading}
          hasOlderNotes={hasNextPage}
          isLoadingOlderNotes={isFetchingNextPage}
          onLoadOlderNotes={loadOlderNotes}
        />

        <div className="shrink-0">
          <NotesForm
            onSubmit={handleAddNote}
            allowAttachment
            maxFileSize={TICKET_NOTE_MAX_FILE_SIZE}
            maxFileSizeMessage="Attachment exceeds the 10 MB limit"
            isSubmitting={isSending}
          />
        </div>
      </div>
    </SectionCard>
  );
}
