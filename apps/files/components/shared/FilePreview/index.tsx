"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { CaretLeft, CaretRight, FileX, PlayCircle } from "@phosphor-icons/react";
import { IconButton, useFormatter } from "@orgtik/ui";
import { IFile } from "@/types";
import { FileTypeIcon } from "@/components/shared/FileTypeIcon";
import { BaseDialog } from "@/components/dialogs/BaseDialog";
import { ProtectedImage } from "@/components/shared/ProtectedImage";
import { useProtectedObjectUrl } from "@/hooks/useProtectedObjectUrl";
import { ProtectedOfficePreview } from "@/components/shared/ProtectedOfficePreview";
import { StructuredBoardPreview } from "@/components/shared/StructuredBoardPreview";
import { getProtectedFileUrl } from "@/lib/get-protected-file-url";

interface FilePreviewProps {
  file: IFile;
  images?: IFile[];
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isThumbnailOnly?: boolean;
  hideTrigger?: boolean;
}

const OFFICE_EXTENSIONS = new Set([
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
]);

export function FilePreview({
  file,
  images = [],
  currentIndex,
  onIndexChange,
  open,
  onOpenChange,
  isThumbnailOnly = false,
  hideTrigger = false,
}: FilePreviewProps) {
  const tf = useTranslations("Files");
  const format = useFormatter();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [file, open]);

  useEffect(() => {
    if (!open || !onIndexChange || currentIndex === undefined || images.length <= 1)
      return;

    // The arrow that points to "next" depends on the reading direction (left in Arabic).
    const handleKeyDown = (e: KeyboardEvent) => {
      const rtl = document.documentElement.dir === "rtl";
      const forward = rtl ? "ArrowLeft" : "ArrowRight";
      const back = rtl ? "ArrowRight" : "ArrowLeft";
      if (e.key === forward && currentIndex < images.length - 1) {
        onIndexChange(currentIndex + 1);
      } else if (e.key === back && currentIndex > 0) {
        onIndexChange(currentIndex - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentIndex, images.length, onIndexChange]);

  if (!file) return null;

  const name = file.name || "Unknown";
  const mimeType = file.mimeType || "";
  const extension = name.split(".").pop()?.toLowerCase().split(/\?|#/)[0] || "";

  const isImage = mimeType.startsWith("image/");
  const isVideo = mimeType.startsWith("video/");
  const isPdf = mimeType === "application/pdf" || extension === "pdf";
  const isOffice = OFFICE_EXTENSIONS.has(extension);
  const needsProtectedMedia = isImage || isVideo || isPdf;

  const protectedUrl = getProtectedFileUrl(file);

  if (!protectedUrl)
    return (
      <span role="img" aria-label={tf("noPreview")} className="grid size-12 place-items-center text-fg-subtle [&>svg]:size-full">
        <FileX weight="duotone" />
      </span>
    );

  const title = file.originalName || name;
  const fileSizeKB = file.size ? format.bytes(Number(file.size)) : "";

  // The picture alone (inside a card's own button), or as the button that opens the preview.
  const visual = (
    <div className="group relative h-44 w-full overflow-hidden rounded-field border border-line">
      {isImage ? (
        <ProtectedImage
          src={protectedUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : isVideo ? (
        <ProtectedVideoThumb protectedUrl={protectedUrl} />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-sunken transition-colors group-hover:bg-hover">
          <FileTypeIcon name={name} mimeType={mimeType} className="size-12" />
          <span dir="ltr" className="text-caption font-medium text-fg-muted">
            {extension.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );

  if (isThumbnailOnly) {
    return visual;
  }
  const triggerContent = (
    <button type="button" aria-label={tf("preview", { name })} className="block w-full cursor-pointer rounded-field focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
      {visual}
    </button>
  );

  const hasMultipleImages = images.length > 1;
  const showNext =
    hasMultipleImages &&
    currentIndex !== undefined &&
    currentIndex < images.length - 1;
  const showPrev =
    hasMultipleImages && currentIndex !== undefined && currentIndex > 0;

  const handleWheel = (e: React.WheelEvent) => {
    if (!isImage) return;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => Math.min(Math.max(prev + delta, 1), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <BaseDialog
      title={title}
      description={fileSizeKB}
      isCloseBtn
      size="5xl"
      open={open}
      onOpenChange={onOpenChange}
      content={
        <div
          className="group/dialog relative flex h-[75vh] w-full cursor-default items-center justify-center overflow-hidden rounded-t-overlay bg-sunken"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {file.whiteboard ? <StructuredBoardPreview file={file} /> : needsProtectedMedia ? (
            <ProtectedDialogMedia
              protectedUrl={protectedUrl}
              name={name}
              title={title}
              isImage={isImage}
              isVideo={isVideo}
              isPdf={isPdf}
              scale={scale}
              position={position}
              isDragging={isDragging}
            />
          ) : isOffice ? (
            <ProtectedOfficePreview
              file={file}
              extension={extension}
              title={title}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <FileTypeIcon name={name} mimeType={mimeType} className="size-16" />
              <span dir="ltr" className="text-body-sm font-medium text-fg-muted">
                {extension.toUpperCase()}
              </span>
              <span className="text-body-sm text-fg-muted">{tf("noPreview")}</span>
            </div>
          )}

          {showPrev && (
            <IconButton
              variant="secondary"
              label={tf("previousImage")}
              icon={<CaretLeft className="rtl:-scale-x-100" />}
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange?.(currentIndex - 1);
              }}
              className="absolute start-4 top-1/2 z-50 -translate-y-1/2 shadow-raised"
            />
          )}
          {showNext && (
            <IconButton
              variant="secondary"
              label={tf("nextImage")}
              icon={<CaretRight className="rtl:-scale-x-100" />}
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange?.(currentIndex + 1);
              }}
              className="absolute end-4 top-1/2 z-50 -translate-y-1/2 shadow-raised"
            />
          )}
        </div>
      }
    >
      {hideTrigger ? null : triggerContent}
    </BaseDialog>
  );
}

function ProtectedVideoThumb({ protectedUrl }: { protectedUrl: string }) {
  const { objectUrl } = useProtectedObjectUrl(protectedUrl);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <PlayCircle
        weight="fill"
        aria-hidden="true"
        className="absolute z-10 size-10 text-white/80 transition-transform group-hover:scale-110 motion-reduce:transition-none"
      />
      {objectUrl ? (
        <video
          src={objectUrl}
          className="w-full h-full object-cover opacity-60"
        />
      ) : (
        <div className="w-full h-full bg-black" />
      )}
    </div>
  );
}

function ProtectedDialogMedia({
  protectedUrl,
  name,
  title,
  isImage,
  isVideo,
  isPdf,
  scale,
  position,
  isDragging,
}: {
  protectedUrl: string;
  name: string;
  title: string;
  isImage: boolean;
  isVideo: boolean;
  isPdf: boolean;
  scale: number;
  position: { x: number; y: number };
  isDragging: boolean;
}) {
  // Images use ProtectedImage (own fetch); skip duplicate blob fetch here.
  const { objectUrl, loading } = useProtectedObjectUrl(
    isImage ? null : protectedUrl,
  );

  if (isImage) {
    return (
      <div
        className="relative w-full h-full transition-transform duration-200 ease-out select-none"
        style={{
          transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <ProtectedImage
          src={protectedUrl}
          alt={name}
          fill
          className="object-contain"
        />
      </div>
    );
  }

  if (loading || !objectUrl) {
    return <div className="h-full w-full animate-pulse bg-sunken motion-reduce:animate-none" />;
  }

  if (isVideo) {
    return (
      <video
        src={objectUrl}
        controls
        autoPlay
        className="max-w-full max-h-full rounded-t-overlay"
      />
    );
  }

  if (isPdf) {
    return (
      <iframe
        src={`${objectUrl}#toolbar=0&navpanes=0&scrollbar=0`}
        title={title}
        width="100%"
        height="100%"
        className="rounded-t-overlay border-none bg-raised"
      />
    );
  }

  return null;
}
