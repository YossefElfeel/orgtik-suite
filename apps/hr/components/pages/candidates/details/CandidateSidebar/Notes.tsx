"use client";
import { PaperPlaneRight as Send } from "@phosphor-icons/react";

import { useFormatter, useTranslations } from "next-intl";
import { IconButton } from "@/components/shared/IconButton";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  useCreateApplicationNoteMutation,
  useGetApplicationNotesQuery,
} from "@/redux/features/job/jobApi";

type Props = {
  applicationId: number;
};

function Notes({ applicationId }: Props) {
  const tActions = useTranslations("actions");
  const t = useTranslations("candidateDetails.sidebar");
  const format = useFormatter();
  const [note, setNote] = useState("");
  const { data, isLoading } = useGetApplicationNotesQuery({ applicationId });
  const [createApplicationNote, { isLoading: isSubmitting }] =
    useCreateApplicationNoteMutation();

  const notes = data?.data ?? [];
  const formatNoteDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return format.dateTime(date, { dateStyle: "short", timeStyle: "short" });
  };

  const onSubmitNote = async () => {
    const trimmedNote = note.trim();
    if (!trimmedNote) return;

    await createApplicationNote({
      applicationId,
      note: trimmedNote,
    }).unwrap();
    setNote("");
  };

  return (
    <div className="rounded-xl border bg-raised p-5">
      <h3 className="mb-3 pb-3 border-b text-body-lg font-semibold leading-6 text-fg">
        {t("notesCount", { count: notes.length })}
      </h3>

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-caption text-fg-subtle">{t("loadingNotes")}</p>
        ) : notes.length > 0 ? (
          notes.map((item) => (
            <div key={item.id} className="space-y-2 pb-2.5 border-b">
              <div className="flex items-center justify-between gap-2">
                <span className="text-body font-semibold text-fg">
                  <bdi>{item.authorName}</bdi>
                </span>
                <span className="text-caption text-fg-subtle">
                  {formatNoteDate(item.createdAt)}
                </span>
              </div>
              <p dir="auto" className="text-caption leading-tight text-fg-subtle line-clamp-4">
                {item.note}
              </p>
            </div>
          ))
        ) : (
          <p className="text-caption text-fg-subtle">{t("noNotes")}</p>
        )}
      </div>

      {/* Note input */}
      <div className="mt-12 border rounded-full p-1 flex items-center gap-2">
        <Input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (!isSubmitting) {
                void onSubmitNote();
              }
            }
          }}
          placeholder={t("leaveNotePlaceholder")}
          aria-label={t("leaveNotePlaceholder")}
          className="h-10 flex-1 resize-none
         rounded-full border-none shadow-none px-2 text-body text-fg placeholder:text-fg-subtle "
        />
        <IconButton
          label={tActions("addNote")}
          type="button"
          className="rounded-full"
          onClick={() => void onSubmitNote()}
          disabled={isSubmitting || note.trim().length === 0}
        >
          <Send className="size-4" />
        </IconButton>
      </div>
    </div>
  );
}

export default Notes;
