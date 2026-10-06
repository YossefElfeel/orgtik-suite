"use client";

// One attachment on a comment. An image is a thumbnail that opens the viewer; anything else is a
// card with its type, name, size and a real download. Images, video, audio, PDFs and text files
// can also be looked at in the viewer; the rest are download only.
import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  DownloadSimple,
  File,
  FileAudio,
  FileCode,
  FileDoc,
  FileImage,
  FilePdf,
  FilePpt,
  FileVideo,
  FileXls,
  FileZip,
} from "@phosphor-icons/react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  IconButton,
  Spinner,
  useFormatter,
} from "@orgtik/ui";
import { getAttachmentCategory } from "@/lib/attachments";
import { downloadAttachmentFile } from "@/lib/downloadAttachmentFile";
import { isolate } from "@/lib/bidi";
import type { ICommentAttachment } from "@/types/comments";
import { safeFileUrl } from "./text";

type Preview = "image" | "video" | "audio" | "pdf" | "code" | null;

const extOf = (name: string) => (name.includes(".") ? name.split(".").pop()!.toLowerCase() : "");

function describe(a: ICommentAttachment): { preview: Preview; icon: ReactNode } {
  const name = a.originalName || a.filename || "";
  const ext = extOf(name);
  const category = getAttachmentCategory(a.mimetype || "", name);
  const cls = "size-5";
  if (category === "image") return { preview: "image", icon: <FileImage aria-hidden="true" className={cls} /> };
  if (category === "video") return { preview: "video", icon: <FileVideo aria-hidden="true" className={cls} /> };
  if (category === "audio") return { preview: "audio", icon: <FileAudio aria-hidden="true" className={cls} /> };
  if (category === "code") return { preview: "code", icon: <FileCode aria-hidden="true" className={cls} /> };
  if (category === "archive") return { preview: null, icon: <FileZip aria-hidden="true" className={cls} /> };
  if (ext === "pdf" || a.mimetype === "application/pdf") return { preview: "pdf", icon: <FilePdf aria-hidden="true" className={cls} /> };
  if (["xls", "xlsx", "csv"].includes(ext)) return { preview: null, icon: <FileXls aria-hidden="true" className={cls} /> };
  if (["ppt", "pptx"].includes(ext)) return { preview: null, icon: <FilePpt aria-hidden="true" className={cls} /> };
  if (["doc", "docx"].includes(ext)) return { preview: null, icon: <FileDoc aria-hidden="true" className={cls} /> };
  return { preview: null, icon: <File aria-hidden="true" className={cls} /> };
}

function useDownload(a: ICommentAttachment, name: string) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await downloadAttachmentFile(a.fileUrl, name);
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}

export function AttachmentCard({ attachment }: { attachment: ICommentAttachment }) {
  const t = useTranslations("TaskComments");
  const f = useFormatter();
  const [open, setOpen] = useState(false);
  const name = attachment.originalName || attachment.filename || t("untitledFile");
  const { preview, icon } = describe(attachment);
  const src = safeFileUrl(attachment.fileUrl);
  const canPreview = !!preview && !!src;
  const download = useDownload(attachment, name);
  const ext = extOf(name).toUpperCase();

  const viewer = canPreview ? (
    <AttachmentViewer open={open} onOpenChange={setOpen} attachment={attachment} name={name} kind={preview!} src={src!} />
  ) : null;

  if (preview === "image" && src) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("openImage", { name: isolate(name) })}
          className="block size-24 overflow-hidden rounded-card border border-line bg-sunken transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {/* Thumbnails come from the attachment store's own host, which isn't known at build time. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" loading="lazy" className="size-full object-cover" />
        </button>
        {viewer}
      </>
    );
  }

  return (
    <div className="flex w-full max-w-72 items-center gap-3 rounded-card border border-line bg-raised p-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-field bg-sunken text-fg-muted">{icon}</span>
      <div className="min-w-0 flex-1">
        {canPreview ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            dir="auto"
            title={name}
            className="block max-w-full truncate text-start text-label text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus"
          >
            {name}
          </button>
        ) : (
          <p dir="auto" title={name} className="truncate text-label text-fg">
            {name}
          </p>
        )}
        <p className="text-caption text-fg-muted tabular-nums">
          {ext ? `${ext} · ` : ""}
          {f.bytes(attachment.size || 0)}
        </p>
      </div>
      <IconButton
        variant="ghost"
        size="sm"
        label={t("download", { name: isolate(name) })}
        icon={download.busy ? <Spinner size="sm" /> : <DownloadSimple aria-hidden="true" />}
        aria-busy={download.busy || undefined}
        disabled={download.busy}
        onClick={download.run}
      />
      {viewer}
    </div>
  );
}

function AttachmentViewer({
  open,
  onOpenChange,
  attachment,
  name,
  kind,
  src,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachment: ICommentAttachment;
  name: string;
  kind: Exclude<Preview, null>;
  src: string;
}) {
  const t = useTranslations("TaskComments");
  const f = useFormatter();
  const download = useDownload(attachment, name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle className="truncate">
            <span dir="auto">{name}</span>
          </DialogTitle>
          <p className="text-caption text-fg-muted tabular-nums">{f.bytes(attachment.size || 0)}</p>
        </DialogHeader>
        <DialogBody>
          {open ? <ViewerContent kind={kind} src={src} name={name} /> : null}
        </DialogBody>
        <DialogFooter>
          <Button
            variant="primary"
            loading={download.busy}
            startIcon={<DownloadSimple aria-hidden="true" />}
            onClick={download.run}
          >
            {t("downloadPlain")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViewerContent({ kind, src, name }: { kind: Exclude<Preview, null>; src: string; name: string }) {
  const t = useTranslations("TaskComments");
  if (kind === "image") {
    return (
      <div className="grid place-items-center rounded-card bg-sunken">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={name} className="max-h-[70vh] max-w-full object-contain" />
      </div>
    );
  }
  if (kind === "video") {
    return (
      <video src={src} controls className="max-h-[70vh] w-full rounded-card bg-sunken">
        {t("noPreview")}
      </video>
    );
  }
  if (kind === "audio") return <audio src={src} controls className="w-full" />;
  if (kind === "pdf") return <iframe src={src} title={name} className="h-[70vh] w-full rounded-card border border-line bg-sunken" />;
  return <TextPreview src={src} />;
}

function TextPreview({ src }: { src: string }) {
  const t = useTranslations("TaskComments");
  const [state, setState] = useState<{ status: "loading" | "ready" | "error"; text: string }>({ status: "loading", text: "" });

  useEffect(() => {
    let live = true;
    fetch(src)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((text) => live && setState({ status: "ready", text: text.slice(0, 15000) }))
      .catch(() => live && setState({ status: "error", text: "" }));
    return () => {
      live = false;
    };
  }, [src]);

  if (state.status === "loading") {
    return (
      <div className="grid place-items-center py-12" aria-busy="true">
        <Spinner label={t("loadingPreview")} />
      </div>
    );
  }
  if (state.status === "error") return <p className="py-8 text-center text-body-sm text-fg-muted">{t("previewFailed")}</p>;
  return (
    <pre dir="ltr" className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-all rounded-card bg-sunken p-4 font-mono text-caption text-fg">
      <code>{state.text}</code>
    </pre>
  );
}
