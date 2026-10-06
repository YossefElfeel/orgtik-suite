"use client";

// The contract's document, fetched with the session and shown from a local copy: a PDF in a frame,
// a photo as an image. Loading, and a failure with Retry, are said in the dialog.
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, ErrorState, LoadingState } from "@orgtik/ui";
import { useAppSelector } from "@/redux/app/hooks";
import { fetchContractDocument, isImage } from "@/lib/deals/documents";

type Props = { contractId: string; title: string; open: boolean; onOpenChange: (open: boolean) => void };

export default function ContractPreviewDialog({ contractId, title, open, onOpenChange }: Props) {
  const t = useTranslations("Projects");
  const token = useAppSelector((s) => s.auth.token);
  const [doc, setDoc] = useState<{ url: string; image: boolean } | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open) return;
    let url: string | null = null;
    let live = true;
    setDoc(null);
    setFailed(false);
    fetchContractDocument(contractId, token)
      .then((d) => {
        if (!live) return;
        url = URL.createObjectURL(d.blob.type === d.contentType ? d.blob : new Blob([d.blob], { type: d.contentType }));
        setDoc({ url, image: isImage(d.contentType) });
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, contractId, token, attempt]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>
            <span dir="auto">{title}</span>
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          {failed ? (
            <ErrorState size="compact" title={t("documentError")} onRetry={() => setAttempt((a) => a + 1)} />
          ) : !doc ? (
            <LoadingState rows={6} label={t("documentLoading")} />
          ) : doc.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doc.url} alt={title} className="mx-auto max-h-[70vh] rounded-field border border-line object-contain" />
          ) : (
            <iframe src={doc.url} title={title} className="h-[70vh] w-full rounded-field border border-line" />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
