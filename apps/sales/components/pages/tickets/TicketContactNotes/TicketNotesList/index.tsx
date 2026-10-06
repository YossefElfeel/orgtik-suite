"use client";
import { useTranslations } from "next-intl";

import { useEffect, useLayoutEffect, useRef } from "react";
import TicketNoteBubble from "@/components/pages/tickets/TicketContactNotes/TicketNotesList/TicketNoteBubble";
import TicketNotesSkeleton from "@/components/pages/tickets/TicketContactNotes/TicketNotesList/TicketNotesSkeleton";
import type { TicketNote } from "@/types/tickets";

type Props = {
  notes: TicketNote[];
  isLoading: boolean;
  hasOlderNotes: boolean;
  isLoadingOlderNotes: boolean;
  onLoadOlderNotes: () => void;
};

export default function TicketNotesList({
  notes,
  isLoading,
  hasOlderNotes,
  isLoadingOlderNotes,
  onLoadOlderNotes,
}: Props) {
  const tCommon = useTranslations("common");
  const listRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  // Scroll metrics captured right before older notes are prepended.
  const anchorRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const anchor = anchorRef.current;
    anchorRef.current = null;

    // Older notes shift the content down, so keep the reading position steady.
    list.scrollTop = anchor
      ? list.scrollHeight - anchor.scrollHeight + anchor.scrollTop
      : list.scrollHeight;
  }, [notes]);

  useEffect(() => {
    const list = listRef.current;
    const sentinel = topSentinelRef.current;
    if (!list || !sentinel) return;
    if (!hasOlderNotes || isLoadingOlderNotes || isLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        anchorRef.current = {
          scrollHeight: list.scrollHeight,
          scrollTop: list.scrollTop,
        };
        onLoadOlderNotes();
      },
      { root: list, rootMargin: "80px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasOlderNotes, isLoading, isLoadingOlderNotes, onLoadOlderNotes]);

  return (
    <div
      ref={listRef}
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pe-1"
    >
      {isLoading ? (
        <TicketNotesSkeleton />
      ) : notes.length === 0 ? (
        <p className="py-8 text-center text-sm text-secondary">
          {tCommon("noNotesYet")}
        </p>
      ) : (
        <>
          <div ref={topSentinelRef} />

          {isLoadingOlderNotes ? <TicketNotesSkeleton count={2} /> : null}

          {notes.map((note) => (
            <TicketNoteBubble key={note.id} note={note} />
          ))}
        </>
      )}
    </div>
  );
}
