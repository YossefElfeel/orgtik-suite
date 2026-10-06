"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotesAttachmentChip from "@/components/shared/Notes/NotesAttachmentChip";
import { cn } from "@/lib/utils";

export type NotesFormPayload = {
  content: string;
  file?: File;
};

type Props = {
  /** Return `false` to keep the draft (e.g. request failed). */
  onSubmit: (
    payload: NotesFormPayload,
  ) => void | boolean | Promise<void | boolean>;
  placeholder?: string;
  /** Shows the attach control and allows one optional file. */
  allowAttachment?: boolean;
  /** Attachment size limit in bytes. Applies when `allowAttachment` is set. */
  maxFileSize?: number;
  maxFileSizeMessage?: string;
  isSubmitting?: boolean;
};

type DraftFile = {
  file: File;
  previewUrl?: string;
};

export function NotesForm({
  onSubmit,
  placeholder = "Type any Note...",
  allowAttachment = false,
  maxFileSize,
  maxFileSizeMessage = "Attachment is too large",
  isSubmitting = false,
}: Props) {
  const [draft, setDraft] = useState("");
  const [draftFile, setDraftFile] = useState<DraftFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const previewUrl = draftFile?.previewUrl;
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [draftFile?.previewUrl]);

  function handleFileSelected(selected: FileList | null) {
    const file = selected?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    if (maxFileSize && file.size > maxFileSize) {
      toast.error(maxFileSizeMessage);
      return;
    }

    setDraftFile({
      file,
      previewUrl: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSubmitting) return;

    const result = await onSubmit({ content, file: draftFile?.file });
    if (result === false) return;

    setDraft("");
    setDraftFile(null);
  }

  return (
    <div className="flex flex-col gap-2">
      {allowAttachment && draftFile ? (
        <NotesAttachmentChip
          file={draftFile.file}
          previewUrl={draftFile.previewUrl}
          onRemove={() => setDraftFile(null)}
        />
      ) : null}

      <form onSubmit={handleSubmit} className="relative">
        {allowAttachment ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(event) => handleFileSelected(event.target.files)}
            />
            <button
              type="button"
              aria-label="Attach file"
              onClick={() => fileInputRef.current?.click()}
              className="absolute top-1/2 left-3 z-10 -translate-y-1/2 rounded-md p-0.5 text-secondary transition-colors hover:text-foreground"
            >
              <Icon icon="solar:paperclip-linear" className="size-4" />
            </button>
          </>
        ) : null}

        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          className={cn(
            "h-11 rounded-full border-border bg-white pr-12 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
            allowAttachment ? "pl-10" : "pl-4",
          )}
        />
        <Button
          type="submit"
          size="icon-sm"
          aria-label="Add note"
          disabled={isSubmitting}
          className="absolute top-1/2 right-1.5 size-8 -translate-y-1/2 rounded-full"
        >
          {isSubmitting ? (
            <Loader className="size-4 animate-spin" />
          ) : (
            <Icon icon="solar:plain-2-bold" className="size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
