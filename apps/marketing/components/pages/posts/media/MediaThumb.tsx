"use client";

import { FilmStrip } from "@phosphor-icons/react";
import { cn } from "@orgtik/ui";
import type { IGalleryItem } from "@/types/post";
import { isVideo } from "../shared/media";

/** An image, or a video's first frame with a film mark, in a square. Videos were drawn as broken <img>s (MKT-056). */
export function MediaThumb({ item, className, decorative = false }: { item: IGalleryItem; className?: string; decorative?: boolean }) {
  const video = isVideo(item);
  return (
    <span className={cn("relative block aspect-square overflow-hidden rounded-field bg-sunken", className)}>
      {video ? (
        <video src={item.image} muted preload="metadata" playsInline aria-hidden className="size-full object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt={decorative ? "" : item.alt || ""} loading="lazy" className="size-full object-cover" />
      )}
      {video ? (
        <span aria-hidden className="absolute bottom-1.5 start-1.5 grid size-6 place-items-center rounded-pill bg-overlay text-fg">
          <FilmStrip weight="fill" className="size-3.5" />
        </span>
      ) : null}
    </span>
  );
}
