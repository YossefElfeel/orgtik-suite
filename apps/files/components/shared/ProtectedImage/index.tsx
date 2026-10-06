"use client";

import { cn } from "@/lib/utils";
import { useProtectedObjectUrl } from "@/hooks/useProtectedObjectUrl";

interface ProtectedImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** When true, image fills its relatively-positioned parent (same as next/image fill). */
  fill?: boolean;
  priority?: boolean;
}

export function ProtectedImage({
  src,
  alt,
  className,
  fill = false,
}: ProtectedImageProps) {
  const { objectUrl, loading, error } = useProtectedObjectUrl(src);

  if (loading) {
    return (
      <div
        className={cn(
          "animate-pulse bg-sunken motion-reduce:animate-none",
          fill ? "absolute inset-0" : "w-full h-full",
          className,
        )}
        aria-hidden
      />
    );
  }

  if (error || !objectUrl) {
    return (
      <div
        className={cn(
          "bg-sunken",
          fill ? "absolute inset-0" : "w-full h-full",
          className,
        )}
        aria-hidden
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "relative overflow-hidden select-none",
        fill ? "absolute inset-0 w-full h-full" : "w-full h-full",
      )}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={objectUrl}
        alt=""
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className={cn(
          "pointer-events-none select-none [-webkit-user-drag:none]",
          fill && "absolute inset-0 w-full h-full",
          className,
        )}
      />
      {/* Blocks right-click "Open image in new tab" / drag-save on the bitmap */}
      <span
        aria-hidden
        className="absolute inset-0 z-1"
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
