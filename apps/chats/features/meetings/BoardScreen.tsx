"use client";

/**
 * SOMION HQ - BOARDS (the whiteboard outside a call)
 *
 * The same board as in a call, standing on its own: for the sketch that does
 * not need a meeting. It is saved through the File Manager as it changes,
 * which is the same rule attachments and recordings follow - HQ keeps no
 * store of its own.
 */

import { FolderOpen } from "@phosphor-icons/react";
import { Chip } from "@/components/ui/Primitives";
import { Whiteboard } from "./Whiteboard";
import { useT } from "@/lib/i18n";

export function BoardScreen() {
  const t = useT();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-baseline gap-2.5">
          <h1 className="hq-title" style={{ color: "var(--color-ink)" }}>
            {t("boards.title", "Whiteboard")}
          </h1>
          <span className="text-[12.5px]" style={{ color: "var(--color-ink-muted)" }}>
            {t("boards.subtitle", "A board without a meeting")}
          </span>
        </div>
        <Chip>
          <FolderOpen size={12} aria-hidden="true" className="me-1 inline" />
          {t("boards.saved", "Saved in Files as you draw")}
        </Chip>
      </header>
      <div className="min-h-0 flex-1 px-4 pb-4">
        <div className="h-full overflow-hidden" style={{ borderRadius: "var(--radius-card)", border: "1px solid var(--color-hairline)" }}>
          <Whiteboard />
        </div>
      </div>
    </div>
  );
}
