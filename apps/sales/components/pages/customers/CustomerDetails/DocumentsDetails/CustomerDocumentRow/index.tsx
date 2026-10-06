"use client";

// One KYC document: its name and size, Preview, Download and, for staff, Replace and Delete.
// Delete asks first, naming the file (SAL-078). The preview and download send the session token
// only to the API's own address (SAL-059). Buttons are no longer nested in links (SAL-180).
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { DownloadSimple, Eye, FileText, Trash, UploadSimple } from "@phosphor-icons/react";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  ErrorState,
  IconButton,
  Spinner,
  toast,
  useFormatter,
} from "@orgtik/ui";
import { useAppSelector } from "@/redux/app/hooks";
import {
  useDeleteBusinessDocumentMutation,
  useDeleteIdDocumentMutation,
  useUploadBusinessDocumentMutation,
  useUploadIdDocumentMutation,
} from "@/redux/features/customers/customersApi";
import { createBlobPreviewUrl, downloadBlob, fetchAuthenticatedDocument, isImageDocument, isPdfDocument } from "@/lib/documents";
import { isolate } from "@/lib/bidi";
import type { CustomerDocument } from "@/types/customers";

type Props = {
  /** The customer; without it the row only shows and opens the file. */
  id?: string;
  type?: "id" | "business";
  document: CustomerDocument | null;
  /** The document's kind, for names ("ID document"). */
  label: string;
  canEdit?: boolean;
};

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";

export function CustomerDocumentRow({ id, type, document, label, canEdit = false }: Props) {
  const t = useTranslations("Customers.documents");
  const f = useFormatter();
  const token = useAppSelector((state) => state.auth.token);
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ url: string | null; kind: "image" | "pdf" | "other"; failed: boolean } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [uploadId, idUpload] = useUploadIdDocumentMutation();
  const [uploadBusiness, bizUpload] = useUploadBusinessDocumentMutation();
  const [deleteId] = useDeleteIdDocumentMutation();
  const [deleteBusiness] = useDeleteBusinessDocumentMutation();
  const editable = canEdit && Boolean(id && type);
  const uploading = idUpload.isLoading || bizUpload.isLoading;

  const upload = async (file: File | undefined) => {
    if (!file || !id || !type) return;
    try {
      await (type === "id" ? uploadId({ id, file }) : uploadBusiness({ id, file })).unwrap();
    } catch {
      // The app's toast says why.
    } finally {
      if (input.current) input.current.value = "";
    }
  };

  const openPreview = async () => {
    if (!document?.url) return;
    setPreview({ url: null, kind: "other", failed: false });
    try {
      const { blob, contentType } = await fetchAuthenticatedDocument(document.url, token);
      const kind = contentType.startsWith("image/") || isImageDocument(document.url) ? "image" : isPdfDocument(document.url, contentType) ? "pdf" : "other";
      setPreview({ url: createBlobPreviewUrl(blob, kind === "pdf" ? "application/pdf" : contentType), kind, failed: false });
    } catch {
      setPreview({ url: null, kind: "other", failed: true });
    }
  };

  const closePreview = () => {
    if (preview?.url?.startsWith("blob:")) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const download = async () => {
    if (!document?.url) return;
    setDownloading(true);
    try {
      const { blob } = await fetchAuthenticatedDocument(document.url, token);
      downloadBlob(blob, document.name || "document");
    } catch {
      toast.error(t("downloadFailed"));
    } finally {
      setDownloading(false);
    }
  };

  const picker = editable ? (
    <input ref={input} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => void upload(e.target.files?.[0])} />
  ) : null;

  if (!document) {
    return (
      <div className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-dashed border-line bg-sunken px-3 py-2.5">
        <p className="text-body-sm text-fg-muted">{t("none")}</p>
        {picker}
        {editable ? (
          <Button size="sm" variant="secondary" startIcon={<UploadSimple />} loading={uploading} onClick={() => input.current?.click()}>
            {t("upload")}
          </Button>
        ) : null}
      </div>
    );
  }

  const size = Number(document.size);
  const hasFile = Boolean(document.url && document.url !== "#");

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-raised px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <FileText aria-hidden className="size-5 shrink-0 text-fg-muted" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-fg" dir="auto">
            {document.name}
          </span>
          {Number.isFinite(size) && size > 0 ? <span className="text-caption text-fg-muted">{f.bytes(size)}</span> : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {hasFile ? (
          <>
            <IconButton size="sm" variant="ghost" label={t("preview", { name: document.name })} icon={<Eye />} onClick={() => void openPreview()} />
            <IconButton size="sm" variant="ghost" label={t("download", { name: document.name })} icon={downloading ? <Spinner size="sm" /> : <DownloadSimple />} disabled={downloading} onClick={() => void download()} />
          </>
        ) : null}
        {editable ? (
          <>
            {picker}
            <IconButton size="sm" variant="ghost" label={t("replace", { name: document.name })} icon={<UploadSimple />} disabled={uploading} onClick={() => input.current?.click()} />
            <ConfirmDialog
              trigger={<IconButton size="sm" variant="ghost" label={t("delete", { name: document.name })} icon={<Trash />} />}
              tone="danger"
              irreversible
              title={t("deleteTitle", { name: isolate(document.name) })}
              impact={t("deleteImpact", { kind: label })}
              confirmLabel={t("deleteConfirm")}
              cancelLabel={t("cancel")}
              onConfirm={() => (type === "id" ? deleteId(id!) : deleteBusiness(id!)).unwrap()}
            />
          </>
        ) : null}
      </div>

      <Dialog open={Boolean(preview)} onOpenChange={(o) => !o && closePreview()}>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>
              <span dir="auto">{document.name}</span>
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="flex min-h-[50vh] items-center justify-center rounded-md bg-sunken p-2">
              {preview?.failed ? (
                <ErrorState size="compact" title={t("previewFailed")} onRetry={() => void openPreview()} />
              ) : !preview?.url ? (
                <Spinner size="lg" label={t("loadingPreview")} />
              ) : preview.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url} alt={document.name} className="max-h-[70vh] rounded-md object-contain" />
              ) : preview.kind === "pdf" ? (
                <iframe src={preview.url} title={document.name} className="h-[70vh] w-full rounded-md border-0" />
              ) : (
                <Button variant="secondary" startIcon={<DownloadSimple />} onClick={() => void download()}>
                  {t("downloadInstead")}
                </Button>
              )}
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CustomerDocumentRow;
