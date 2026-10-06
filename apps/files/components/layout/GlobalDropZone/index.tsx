"use client";

import { useEffect, useRef, useState } from "react";
import { CloudArrowUp } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { FileUploadDialog } from "@/components/dialogs/FileUpload";
import {
  extractDataTransferItems,
  peekDropKindFromDataTransfer,
  type DropKind,
} from "@/lib/drag-drop-extract";
import { useGetFolderByIdQuery } from "@/redux/features/folder/folderApi";
import { useSessionAccess } from "@/hooks/useSessionAccess";
import { canUploadIntoFolder } from "@/lib/permissions";

export function GlobalDropZone() {
  const t = useTranslations("GlobalDropZone");
  const params = useParams();

  const path = params?.path as string[] | undefined;
  const currentFolderId = path ? path[path.length - 1] : undefined;

  const session = useSessionAccess();
  const { data: folderData } = useGetFolderByIdQuery(
    { id: currentFolderId || "" },
    { skip: !currentFolderId },
  );

  const allowUpload =
    !session ||
    canUploadIntoFolder(currentFolderId ? folderData?.data : null, session);

  const [isDragging, setIsDragging] = useState(false);
  const [dragPreviewKind, setDragPreviewKind] = useState<DropKind | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<
    { file: File; relativePath: string }[]
  >([]);
  const [pendingDropKind, setPendingDropKind] = useState<DropKind | null>(null);

  const dragCounter = useRef(0);
  const dialogOpenRef = useRef(false);
  const allowUploadRef = useRef(allowUpload);

  useEffect(() => {
    dialogOpenRef.current = dialogOpen;
  }, [dialogOpen]);

  useEffect(() => {
    allowUploadRef.current = allowUpload;
  }, [allowUpload]);

  useEffect(() => {
    const hasFiles = (e: DragEvent) =>
      Array.from(e.dataTransfer?.types ?? []).includes("Files");

    const onDragEnter = (e: DragEvent) => {
      if (!allowUploadRef.current || !hasFiles(e)) return;
      e.preventDefault();
      dragCounter.current += 1;
      setIsDragging(true);
    };

    const onDragOver = (e: DragEvent) => {
      if (!allowUploadRef.current || !hasFiles(e)) return;
      e.preventDefault();
      const kind = peekDropKindFromDataTransfer(e.dataTransfer);
      if (kind) setDragPreviewKind(kind);
    };

    const onDragLeave = () => {
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsDragging(false);
        setDragPreviewKind(null);
      }
    };

    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      setDragPreviewKind(null);

      if (!allowUploadRef.current) return;
      if (dialogOpenRef.current || !e.dataTransfer) return;

      const { items, dropKind } = await extractDataTransferItems(
        e.dataTransfer,
      );

      if (items.length === 0 && dropKind !== "folders") return;

      setPendingFiles(items);
      setPendingDropKind(dropKind);
      setDialogOpen(true);
    };

    document.addEventListener("dragenter", onDragEnter);
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("drop", onDrop);

    return () => {
      document.removeEventListener("dragenter", onDragEnter);
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("drop", onDrop);
    };
  }, []);

  const handleClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setPendingFiles([]);
      setPendingDropKind(null);
    }
  };

  if (!allowUpload) return null;

  return (
    <>
      {isDragging && !dialogOpen && (
        // Drag and drop is a pointer gesture; the keyboard way is the Upload button, so the overlay is
        // only seen, never announced.
        <div aria-hidden className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-canvas/70 backdrop-blur-xs" />
          <div className="relative flex w-full max-w-2xl flex-col items-center gap-5 rounded-panel border-2 border-dashed border-focus bg-overlay px-8 py-16 shadow-overlay">
            <span className="grid size-20 place-items-center rounded-pill bg-brand-subtle text-fg-brand">
              <CloudArrowUp weight="duotone" className="size-10" />
            </span>
            <div className="text-center">
              <p className="font-display text-title text-fg">{dragPreviewKind === "folders" ? t("dropFolderToUpload") : t("dropFilesToUpload")}</p>
              <p className="mt-1 text-body text-fg-muted">
                {dragPreviewKind === "folders" ? t("releaseFolderToAdd") : dragPreviewKind === "files" ? t("releaseFilesToAdd") : t("releaseToAdd")}
              </p>
            </div>
          </div>
        </div>
      )}

      <FileUploadDialog
        open={dialogOpen}
        onOpenChange={handleClose}
        initialFiles={pendingFiles}
        initialActiveTab={pendingDropKind ?? undefined}
        folderId={currentFolderId}
        onUpload={() => {
          setPendingFiles([]);
          setPendingDropKind(null);
        }}
      />
    </>
  );
}
