"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, FileField, Textarea } from "@orgtik/ui";

/** A delivery: what's delivered and its files. The customer reviews it; it approves itself if they don't. */
export function DeliverDialog({ number, autoApproveDays, busy, error, onDeliver, onClose }: { number: string; autoApproveDays?: number; busy: boolean; error?: string; onDeliver: (note: string, files: string[]) => void; onClose: () => void }) {
  const t = useTranslations("Services");
  const tc = useTranslations("Common");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [tried, setTried] = useState(false);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{t("deliver.title", { number })}</DialogTitle>
          <DialogDescription>{autoApproveDays ? t("deliver.helpDays", { days: autoApproveDays }) : t("deliver.help")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          <Field label={t("deliver.note")} description={t("deliver.noteHelp")} error={error ?? (tried && !note.trim() ? t("deliver.noteRequired") : undefined)} required>
            <Textarea dir="auto" value={note} onChange={(e) => setNote(e.target.value)} maxRows={8} required />
          </Field>
          <FileField label={t("deliver.files")} description={t("deliver.filesHelp")} value={files} onChange={setFiles} multiple maxFiles={10} />
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button
            loading={busy}
            onClick={() => {
              setTried(true);
              if (note.trim()) onDeliver(note.trim(), files.map((f) => f.name));
            }}
          >
            {t("deliver.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
